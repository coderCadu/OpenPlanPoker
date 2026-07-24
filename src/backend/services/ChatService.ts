import { Message } from '@prisma/client';
import { prisma } from '../config/database';
import { ValidationError, NotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';

/**
 * ChatService handles messaging functionality in sessions
 * Messages are truncated to 500 characters as per schema
 */
export class ChatService {
  private static readonly MAX_MESSAGE_LENGTH = 500;

  /**
   * Validate message content
   * @param content Message content
   * @returns true if valid, false otherwise
   */
  validateMessage(content: string): boolean {
    if (!content || content.length === 0) return false;
    if (content.trim().length === 0) return false;
    if (content.length > ChatService.MAX_MESSAGE_LENGTH * 2) return false; // Allow input larger than max, will be truncated
    return true;
  }

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
  async saveMessage(sessionId: string, participantId: string, content: string): Promise<Message> {
    try {
      // Validate message
      if (!this.validateMessage(content)) {
        throw new ValidationError('Message content is empty or invalid', 'INVALID_MESSAGE');
      }

      // Truncate to 500 characters
      const truncatedContent = content.substring(0, ChatService.MAX_MESSAGE_LENGTH);

      const message = await prisma.message.create({
        data: {
          sessionId,
          participantId,
          content: truncatedContent,
        },
      });

      logger.info(
        { sessionId, participantId, contentLength: truncatedContent.length },
        'Message saved'
      );
      return message;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      logger.error(
        { error: String(error), sessionId, participantId },
        'Failed to save message'
      );
      throw error;
    }
  }

  /**
   * Get messages for a session with pagination
   * @param sessionId Session ID
   * @param limit Number of messages to return (default: 50, max: 100)
   * @param offset Number of messages to skip (default: 0)
   * @returns Paginated messages
   */
  async getSessionMessages(
    sessionId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ messages: Message[]; total: number }> {
    try {
      // Validate pagination parameters
      const normalizedLimit = Math.min(Math.max(1, limit), 100);
      const normalizedOffset = Math.max(0, offset);

      const [messages, total] = await Promise.all([
        prisma.message.findMany({
          where: { sessionId },
          orderBy: { createdAt: 'desc' },
          take: normalizedLimit,
          skip: normalizedOffset,
        }),
        prisma.message.count({ where: { sessionId } }),
      ]);

      logger.info(
        { sessionId, limit: normalizedLimit, offset: normalizedOffset, total },
        'Messages retrieved'
      );

      return { messages: messages.reverse(), total }; // Reverse to get chronological order
    } catch (error) {
      logger.error({ error: String(error), sessionId }, 'Failed to get messages');
      throw error;
    }
  }
}

export default ChatService;
