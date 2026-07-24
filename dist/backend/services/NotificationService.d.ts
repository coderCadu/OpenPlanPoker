import { Server as SocketIOServer } from 'socket.io';
/**
 * NotificationService handles real-time notifications via Socket.io
 * Broadcasts events to session participants
 */
export declare class NotificationService {
    private io;
    constructor(io: SocketIOServer);
    /**
     * Broadcast when a participant joins a session
     * @param sessionId Session ID
     * @param pseudonym Participant's pseudonym
     */
    broadcastParticipantJoined(sessionId: string, pseudonym: string): void;
    /**
     * Broadcast when voting starts on a task
     * @param sessionId Session ID
     * @param taskId Task ID
     * @param taskTitle Task title
     */
    broadcastVotingStarted(sessionId: string, taskId: string, taskTitle: string): void;
    /**
     * Broadcast when votes are revealed
     * @param sessionId Session ID
     * @param taskId Task ID
     * @param average Average of votes (or null)
     * @param median Median of votes (or null)
     */
    broadcastVotesRevealed(sessionId: string, taskId: string, average: number | null, median: number | null): void;
    /**
     * Broadcast when a new message is sent
     * @param sessionId Session ID
     * @param participantId Participant ID
     * @param pseudonym Participant's pseudonym
     * @param content Message content
     */
    broadcastMessageSent(sessionId: string, participantId: string, pseudonym: string, content: string): void;
    /**
     * Broadcast when a session is closed
     * @param sessionId Session ID
     */
    broadcastSessionClosed(sessionId: string): void;
}
export default NotificationService;
//# sourceMappingURL=NotificationService.d.ts.map