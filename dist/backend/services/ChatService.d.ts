import { Message } from '@prisma/client';
/**
 * ChatService handles messaging functionality in sessions
 * Messages are truncated to 500 characters as per schema
 */
export declare class ChatService {
    private static readonly MAX_MESSAGE_LENGTH;
    /**
     * Validate message content
     * @param content Message content
     * @returns true if valid, false otherwise
     */
    validateMessage(content: string): boolean;
    /**
     * Save a message to a session
     * Messages are automatically truncated to 500 characters
     * @param sessionId Session ID
     * @param participantId Participant ID
     * @param content Message content
     * @returns Saved message
     * @throws ValidationError if content is invalid
     * @throws NotFoundError if session or participant not found
     */
    saveMessage(sessionId: string, participantId: string, content: string): Promise<Message>;
    /**
     * Get messages for a session with pagination
     * @param sessionId Session ID
     * @param limit Number of messages to return (default: 50, max: 100)
     * @param offset Number of messages to skip (default: 0)
     * @returns Paginated messages
     */
    getSessionMessages(sessionId: string, limit?: number, offset?: number): Promise<{
        messages: Message[];
        total: number;
    }>;
}
export default ChatService;
//# sourceMappingURL=ChatService.d.ts.map