import { Vote } from '@prisma/client';
/**
 * VoteService handles voting logic for planning poker
 * Validates cards, records/updates votes, and calculates statistics
 */
export declare class VoteService {
    private static readonly VALID_CARDS;
    /**
     * Validate if a card is a valid planning poker card
     * @param card Card value to validate
     * @returns true if valid, false otherwise
     */
    validateCard(card: string): boolean;
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
    recordVote(taskId: string, participantId: string, sessionId: string, card: string): Promise<Vote>;
    /**
     * Update an existing vote
     * @param voteId Vote ID
     * @param card New card value
     * @returns Updated vote
     * @throws ValidationError if card is invalid
     * @throws NotFoundError if vote not found
     */
    updateVote(voteId: string, card: string): Promise<Vote>;
    /**
     * Get all votes for a task
     * @param taskId Task ID
     * @returns Array of votes
     */
    getAllVotes(taskId: string): Promise<Vote[]>;
    /**
     * Calculate average of numeric votes, ignoring special cards (?, ☕)
     * @param votes Array of votes
     * @returns Average value or null if no numeric votes
     */
    calculateAverage(votes: Vote[]): number | null;
    /**
     * Calculate median of numeric votes, ignoring special cards (?, ☕)
     * @param votes Array of votes
     * @returns Median value or null if no numeric votes
     */
    calculateMedian(votes: Vote[]): number | null;
    /**
     * Check if all expected participants have voted
     * @param taskId Task ID
     * @param expectedCount Expected number of participants
     * @returns true if all have voted, false otherwise
     */
    hasAllVoted(taskId: string, expectedCount: number): Promise<boolean>;
}
export default VoteService;
//# sourceMappingURL=VoteService.d.ts.map