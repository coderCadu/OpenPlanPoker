import { Session, Participant } from '@prisma/client';
/**
 * SessionService handles all session-related business logic
 * Including creation, joining, leaving, and expiry
 */
export declare class SessionService {
    /**
     * Create a new planning poker session
     * @param name Session name
     * @param moderatorId Pseudonym of the moderator/creator
     * @param description Optional session description
     * @returns Created session
     */
    createSession(name: string, moderatorId: string, description?: string): Promise<Session>;
    /**
     * Add a participant to a session
     * @param sessionId Session ID
     * @param pseudonym Participant's pseudonym (display name)
     * @returns Created participant
     * @throws ConflictError if pseudonym already exists in session
     */
    joinSession(sessionId: string, pseudonym: string): Promise<Participant>;
    /**
     * Remove a participant from a session
     * @param sessionId Session ID
     * @param pseudonym Participant's pseudonym
     * @returns Removed participant
     * @throws NotFoundError if participant not found
     */
    leaveSession(sessionId: string, pseudonym: string): Promise<Participant>;
    /**
     * Retrieve session with all relations
     * @param sessionId Session ID
     * @returns Session or null if not found
     */
    getSession(sessionId: string): Promise<Session | null>;
    /**
     * Retrieve session by slug
     * @param slug Session slug (URL-friendly identifier)
     * @returns Session or null if not found
     */
    getSessionBySlug(slug: string): Promise<Session | null>;
    /**
     * Close a session (no more votes allowed)
     * @param sessionId Session ID
     */
    closeSession(sessionId: string): Promise<void>;
    /**
     * Mark sessions inactive for >30 minutes as archived
     * Should be called periodically (e.g., every 5 minutes)
     * @returns Count of archived sessions
     */
    expireInactiveSessions(): Promise<{
        count: number;
    }>;
    /**
     * Generate a unique slug for a session
     * Retries on collision with exponential backoff
     * @param baseName Base name to derive slug from
     * @param maxRetries Maximum retry attempts (default: 5)
     * @returns Unique slug in kebab-case format
     * @throws Error if unable to generate unique slug after retries
     */
    generateUniqueSlug(baseName: string, maxRetries?: number): Promise<string>;
    /**
     * Convert string to kebab-case slug format
     * @param text Text to slugify
     * @returns Slugified text
     */
    private slugify;
}
export default SessionService;
//# sourceMappingURL=SessionService.d.ts.map