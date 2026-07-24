"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoteService = void 0;
const database_1 = require("../config/database");
const errors_1 = require("../utils/errors");
const logger_1 = require("../utils/logger");
/**
 * VoteService handles voting logic for planning poker
 * Validates cards, records/updates votes, and calculates statistics
 */
class VoteService {
    /**
     * Validate if a card is a valid planning poker card
     * @param card Card value to validate
     * @returns true if valid, false otherwise
     */
    validateCard(card) {
        return VoteService.VALID_CARDS.includes(card);
    }
    /**
     * Record a vote from a participant on a task
     * @param taskId Task ID
     * @param participantId Participant ID
     * @param sessionId Session ID
     * @param card Card value
     * @returns Created vote
     * @throws ValidationError if card is invalid
     * @throws ConflictError if participant already voted on this task
     */
    async recordVote(taskId, participantId, sessionId, card) {
        try {
            // Validate card
            if (!this.validateCard(card)) {
                throw new errors_1.ValidationError(`Invalid card: "${card}". Valid cards are: ${VoteService.VALID_CARDS.join(', ')}`, 'INVALID_CARD');
            }
            // Check if vote already exists
            const existingVote = await database_1.prisma.vote.findUnique({
                where: {
                    taskId_participantId: {
                        taskId,
                        participantId,
                    },
                },
            });
            if (existingVote) {
                throw new errors_1.ConflictError(`Participant has already voted on this task`, 'VOTE_ALREADY_EXISTS');
            }
            const vote = await database_1.prisma.vote.create({
                data: {
                    taskId,
                    participantId,
                    sessionId,
                    card,
                },
            });
            logger_1.logger.info({ taskId, participantId, card }, 'Vote recorded');
            return vote;
        }
        catch (error) {
            if (error instanceof errors_1.ValidationError || error instanceof errors_1.ConflictError) {
                throw error;
            }
            logger_1.logger.error({ error: String(error), taskId, participantId }, 'Failed to record vote');
            throw error;
        }
    }
    /**
     * Update an existing vote
     * @param voteId Vote ID
     * @param card New card value
     * @returns Updated vote
     * @throws ValidationError if card is invalid
     * @throws NotFoundError if vote not found
     */
    async updateVote(voteId, card) {
        try {
            // Validate card
            if (!this.validateCard(card)) {
                throw new errors_1.ValidationError(`Invalid card: "${card}". Valid cards are: ${VoteService.VALID_CARDS.join(', ')}`, 'INVALID_CARD');
            }
            // Check vote exists
            const existingVote = await database_1.prisma.vote.findUnique({
                where: { id: voteId },
            });
            if (!existingVote) {
                throw new errors_1.NotFoundError(`Vote with ID "${voteId}" not found`, 'VOTE_NOT_FOUND');
            }
            const vote = await database_1.prisma.vote.update({
                where: { id: voteId },
                data: { card },
            });
            logger_1.logger.info({ voteId, card }, 'Vote updated');
            return vote;
        }
        catch (error) {
            if (error instanceof errors_1.ValidationError || error instanceof errors_1.NotFoundError) {
                throw error;
            }
            logger_1.logger.error({ error: String(error), voteId }, 'Failed to update vote');
            throw error;
        }
    }
    /**
     * Get all votes for a task
     * @param taskId Task ID
     * @returns Array of votes
     */
    async getAllVotes(taskId) {
        try {
            return await database_1.prisma.vote.findMany({
                where: { taskId },
                orderBy: { createdAt: 'asc' },
            });
        }
        catch (error) {
            logger_1.logger.error({ error: String(error), taskId }, 'Failed to get votes');
            throw error;
        }
    }
    /**
     * Calculate average of numeric votes, ignoring special cards (?, ☕)
     * @param votes Array of votes
     * @returns Average value or null if no numeric votes
     */
    calculateAverage(votes) {
        const numericVotes = votes
            .map((v) => v.card)
            .filter((card) => !['?', '☕'].includes(card))
            .map((card) => parseInt(card, 10))
            .filter((num) => !isNaN(num) && num > 0);
        if (numericVotes.length === 0) {
            return null;
        }
        const sum = numericVotes.reduce((a, b) => a + b, 0);
        return sum / numericVotes.length;
    }
    /**
     * Calculate median of numeric votes, ignoring special cards (?, ☕)
     * @param votes Array of votes
     * @returns Median value or null if no numeric votes
     */
    calculateMedian(votes) {
        const numericVotes = votes
            .map((v) => v.card)
            .filter((card) => !['?', '☕'].includes(card))
            .map((card) => parseInt(card, 10))
            .filter((num) => !isNaN(num) && num > 0)
            .sort((a, b) => a - b);
        if (numericVotes.length === 0) {
            return null;
        }
        const middle = Math.floor(numericVotes.length / 2);
        if (numericVotes.length % 2 === 0) {
            return (numericVotes[middle - 1] + numericVotes[middle]) / 2;
        }
        return numericVotes[middle];
    }
    /**
     * Check if all expected participants have voted
     * @param taskId Task ID
     * @param expectedCount Expected number of participants
     * @returns true if all have voted, false otherwise
     */
    async hasAllVoted(taskId, expectedCount) {
        try {
            const voteCount = await database_1.prisma.vote.count({
                where: { taskId },
            });
            return voteCount >= expectedCount;
        }
        catch (error) {
            logger_1.logger.error({ error: String(error), taskId }, 'Failed to check if all voted');
            throw error;
        }
    }
}
exports.VoteService = VoteService;
// Valid planning poker cards (Fibonacci sequence + special cards)
VoteService.VALID_CARDS = ['1', '2', '3', '5', '8', '13', '21', '?', '☕'];
exports.default = VoteService;
//# sourceMappingURL=VoteService.js.map