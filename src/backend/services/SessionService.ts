import { Session, Participant } from '@prisma/client';
import { prisma } from '../config/database';
import { ConflictError, NotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';

/**
 * SessionService handles all session-related business logic
 * Including creation, joining, leaving, and expiry
 */
export class SessionService {
  /**
   * Create a new planning poker session
   * @param name Session name
   * @param moderatorId Pseudonym of the moderator/creator
   * @param description Optional session description
   * @returns Created session
   */
  async createSession(name: string, moderatorId: string, description?: string): Promise<Session> {
    try {
      const slug = await this.generateUniqueSlug(name);

      const session = await prisma.session.create({
        data: {
          slug,
          name,
          description: description || null,
          moderatorId,
          status: 'ACTIVE',
          lastActivityAt: new Date(),
        },
      });

      logger.info({ sessionId: session.id, slug }, 'Session created');
      return session;
    } catch (error) {
      logger.error({ error: String(error), name, moderatorId }, 'Failed to create session');
      throw error;
    }
  }

  /**
   * Add a participant to a session
   * @param sessionId Session ID
   * @param pseudonym Participant's pseudonym (display name)
   * @returns Created participant
   * @throws ConflictError if pseudonym already exists in session
   */
  async joinSession(sessionId: string, pseudonym: string): Promise<Participant> {
    try {
      const participant = await prisma.participant.create({
        data: {
          sessionId,
          pseudonym,
        },
      });

      // Update session's lastActivityAt
      await prisma.session.update({
        where: { id: sessionId },
        data: { lastActivityAt: new Date() },
      });

      logger.info({ sessionId, pseudonym }, 'Participant joined session');
      return participant;
    } catch (error) {
      if (error instanceof Error && error.message.includes('Unique constraint')) {
        throw new ConflictError(
          `Pseudonym "${pseudonym}" already exists in this session`,
          'DUPLICATE_PSEUDONYM'
        );
      }
      logger.error({ error: String(error), sessionId, pseudonym }, 'Failed to join session');
      throw error;
    }
  }

  /**
   * Remove a participant from a session
   * @param sessionId Session ID
   * @param pseudonym Participant's pseudonym
   * @returns Removed participant
   * @throws NotFoundError if participant not found
   */
  async leaveSession(sessionId: string, pseudonym: string): Promise<Participant> {
    try {
      // Find and delete the participant
      const participant = await prisma.participant.delete({
        where: {
          sessionId_pseudonym: {
            sessionId,
            pseudonym,
          },
        },
      });

      // Update session's lastActivityAt
      await prisma.session.update({
        where: { id: sessionId },
        data: { lastActivityAt: new Date() },
      });

      logger.info({ sessionId, pseudonym }, 'Participant left session');
      return participant;
    } catch (error) {
      if (error instanceof Error && error.message.includes('Record not found')) {
        throw new NotFoundError(
          `Participant "${pseudonym}" not found in session`,
          'PARTICIPANT_NOT_FOUND'
        );
      }
      logger.error({ error: String(error), sessionId, pseudonym }, 'Failed to leave session');
      throw error;
    }
  }

  /**
   * Retrieve session with all relations
   * @param sessionId Session ID
   * @returns Session or null if not found
   */
  async getSession(sessionId: string): Promise<Session | null> {
    try {
      return await prisma.session.findUnique({
        where: { id: sessionId },
        include: {
          participants: true,
          epics: true,
          stories: true,
          tasks: true,
          votes: true,
          messages: true,
        },
      });
    } catch (error) {
      logger.error({ error: String(error), sessionId }, 'Failed to get session');
      throw error;
    }
  }

  /**
   * Retrieve session by slug
   * @param slug Session slug (URL-friendly identifier)
   * @returns Session or null if not found
   */
  async getSessionBySlug(slug: string): Promise<Session | null> {
    try {
      return await prisma.session.findUnique({
        where: { slug },
      });
    } catch (error) {
      logger.error({ error: String(error), slug }, 'Failed to get session by slug');
      throw error;
    }
  }

  /**
   * Close a session (no more votes allowed)
   * @param sessionId Session ID
   */
  async closeSession(sessionId: string): Promise<void> {
    try {
      await prisma.session.update({
        where: { id: sessionId },
        data: { status: 'CLOSED' },
      });

      logger.info({ sessionId }, 'Session closed');
    } catch (error) {
      logger.error({ error: String(error), sessionId }, 'Failed to close session');
      throw error;
    }
  }

  /**
   * Mark sessions inactive for >30 minutes as archived
   * Should be called periodically (e.g., every 5 minutes)
   * @returns Count of archived sessions
   */
  async expireInactiveSessions(): Promise<{ count: number }> {
    try {
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

      const result = await prisma.session.updateMany({
        where: {
          status: 'ACTIVE',
          lastActivityAt: {
            lt: thirtyMinutesAgo,
          },
        },
        data: {
          status: 'ARCHIVED',
          expiresAt: new Date(),
        },
      });

      if (result.count > 0) {
        logger.info({ count: result.count }, 'Sessions expired');
      }

      return result;
    } catch (error) {
      logger.error({ error: String(error) }, 'Failed to expire inactive sessions');
      throw error;
    }
  }

  /**
   * Generate a unique slug for a session
   * Retries on collision with exponential backoff
   * @param baseName Base name to derive slug from
   * @param maxRetries Maximum retry attempts (default: 5)
   * @returns Unique slug in kebab-case format
   * @throws Error if unable to generate unique slug after retries
   */
  async generateUniqueSlug(baseName: string, maxRetries: number = 5): Promise<string> {
    const base = this.slugify(baseName);
    let attempts = 0;

    while (attempts < maxRetries) {
      // Generate slug with random suffix
      const suffix = Math.random().toString(36).substring(2, 6); // 4-char random string
      const slug = `${base}-${suffix}`;

      // Check if slug already exists
      const existing = await prisma.session.findUnique({
        where: { slug },
      });

      if (!existing) {
        return slug;
      }

      attempts++;
    }

    throw new Error(
      `Failed to generate unique slug after ${maxRetries} attempts for base "${baseName}"`
    );
  }

  /**
   * Convert string to kebab-case slug format
   * @param text Text to slugify
   * @returns Slugified text
   */
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/[\s_]+/g, '-') // Replace spaces and underscores with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  }
}

export default SessionService;
