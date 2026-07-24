import { Vote } from '@prisma/client';
import { prisma } from '../config/database';
import { ValidationError, NotFoundError, ConflictError } from '../utils/errors';
import { logger } from '../utils/logger';

/**
 * VoteService handles voting logic for planning poker
 * Validates cards, records/updates votes, and calculates statistics
 */
export class VoteService {
  // Valid planning poker cards (Fibonacci sequence + special cards)
  private static readonly VALID_CARDS = ['1', '2', '3', '5', '8', '13', '21', '?', '☕'];

  /**
   * Validate if a card is a valid planning poker card
   * @param card Card value to validate
   * @returns true if valid, false otherwise
   */
  validateCard(card: string): boolean {
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
  async recordVote(
    taskId: string,
    participantId: string,
    sessionId: string,
    card: string
  ): Promise<Vote> {
    try {
      // Validate card
      if (!this.validateCard(card)) {
        throw new ValidationError(`Invalid card: "${card}". Valid cards are: ${VoteService.VALID_CARDS.join(', ')}`, 'INVALID_CARD');
      }

      // Check if vote already exists
      const existingVote = await prisma.vote.findUnique({
        where: {
          taskId_participantId: {
            taskId,
            participantId,
          },
        },
      });

      if (existingVote) {
        throw new ConflictError(
          `Participant has already voted on this task`,
          'VOTE_ALREADY_EXISTS'
        );
      }

      const vote = await prisma.vote.create({
        data: {
          taskId,
          participantId,
          sessionId,
          card,
        },
      });

      logger.info({ taskId, participantId, card }, 'Vote recorded');
      return vote;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof ConflictError) {
        throw error;
      }
      logger.error({ error: String(error), taskId, participantId }, 'Failed to record vote');
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
  async updateVote(voteId: string, card: string): Promise<Vote> {
    try {
      // Validate card
      if (!this.validateCard(card)) {
        throw new ValidationError(`Invalid card: "${card}". Valid cards are: ${VoteService.VALID_CARDS.join(', ')}`, 'INVALID_CARD');
      }

      // Check vote exists
      const existingVote = await prisma.vote.findUnique({
        where: { id: voteId },
      });

      if (!existingVote) {
        throw new NotFoundError(`Vote with ID "${voteId}" not found`, 'VOTE_NOT_FOUND');
      }

      const vote = await prisma.vote.update({
        where: { id: voteId },
        data: { card },
      });

      logger.info({ voteId, card }, 'Vote updated');
      return vote;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      logger.error({ error: String(error), voteId }, 'Failed to update vote');
      throw error;
    }
  }

  /**
   * Get all votes for a task
   * @param taskId Task ID
   * @returns Array of votes
   */
  async getAllVotes(taskId: string): Promise<Vote[]> {
    try {
      return await prisma.vote.findMany({
        where: { taskId },
        orderBy: { createdAt: 'asc' },
      });
    } catch (error) {
      logger.error({ error: String(error), taskId }, 'Failed to get votes');
      throw error;
    }
  }

  /**
   * Calculate average of numeric votes, ignoring special cards (?, ☕)
   * @param votes Array of votes
   * @returns Average value or null if no numeric votes
   */
  calculateAverage(votes: Vote[]): number | null {
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
  calculateMedian(votes: Vote[]): number | null {
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
  async hasAllVoted(taskId: string, expectedCount: number): Promise<boolean> {
    try {
      const voteCount = await prisma.vote.count({
        where: { taskId },
      });

      return voteCount >= expectedCount;
    } catch (error) {
      logger.error({ error: String(error), taskId }, 'Failed to check if all voted');
      throw error;
    }
  }
}

export default VoteService;
