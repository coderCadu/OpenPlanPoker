import { Server as SocketIOServer } from 'socket.io';
import { logger } from '../utils/logger';

/**
 * NotificationService handles real-time notifications via Socket.io
 * Broadcasts events to session participants
 */
export class NotificationService {
  private io: SocketIOServer;

  constructor(io: SocketIOServer) {
    this.io = io;
  }

  /**
   * Broadcast when a participant joins a session
   * @param sessionId Session ID
   * @param pseudonym Participant's pseudonym
   * @param participantId Participant's ID (DB record)
   */
  broadcastParticipantJoined(sessionId: string, pseudonym: string, participantId?: string): void {
    try {
      const room = `session:${sessionId}`;
      this.io.to(room).emit('participant:joined', {
        pseudonym,
        participantId,
        timestamp: new Date(),
      });

      logger.info({ sessionId, pseudonym }, 'Broadcast: participant joined');
    } catch (error) {
      logger.error(
        { error: String(error), sessionId, pseudonym },
        'Failed to broadcast participant joined'
      );
      throw error;
    }
  }

  /**
   * Broadcast when voting starts on a task
   * @param sessionId Session ID
   * @param taskId Task ID
   * @param taskTitle Task title
   */
  broadcastVotingStarted(sessionId: string, taskId: string, taskTitle: string): void {
    try {
      const room = `session:${sessionId}`;
      this.io.to(room).emit('voting:started', {
        taskId,
        taskTitle,
        timestamp: new Date(),
      });

      logger.info({ sessionId, taskId }, 'Broadcast: voting started');
    } catch (error) {
      logger.error(
        { error: String(error), sessionId, taskId },
        'Failed to broadcast voting started'
      );
      throw error;
    }
  }

  /**
   * Broadcast when votes are revealed
   * @param sessionId Session ID
   * @param taskId Task ID
   * @param average Average of votes (or null)
   * @param median Median of votes (or null)
   */
  broadcastVotesRevealed(
    sessionId: string,
    taskId: string,
    average: number | null,
    median: number | null
  ): void {
    try {
      const room = `session:${sessionId}`;
      this.io.to(room).emit('votes:revealed', {
        taskId,
        average,
        median,
        timestamp: new Date(),
      });

      logger.info({ sessionId, taskId, average, median }, 'Broadcast: votes revealed');
    } catch (error) {
      logger.error(
        { error: String(error), sessionId, taskId },
        'Failed to broadcast votes revealed'
      );
      throw error;
    }
  }

  /**
   * Broadcast when a new message is sent
   * @param sessionId Session ID
   * @param participantId Participant ID
   * @param pseudonym Participant's pseudonym
   * @param content Message content
   */
  broadcastMessageSent(
    sessionId: string,
    participantId: string,
    pseudonym: string,
    content: string
  ): void {
    try {
      const room = `session:${sessionId}`;
      this.io.to(room).emit('message:sent', {
        participantId,
        pseudonym,
        content,
        timestamp: new Date(),
      });

      logger.info({ sessionId, participantId, pseudonym }, 'Broadcast: message sent');
    } catch (error) {
      logger.error(
        { error: String(error), sessionId, participantId },
        'Failed to broadcast message sent'
      );
      throw error;
    }
  }

  /**
   * Broadcast when a session is closed
   * @param sessionId Session ID
   */
  broadcastSessionClosed(sessionId: string): void {
    try {
      const room = `session:${sessionId}`;
      this.io.to(room).emit('session:closed', {
        timestamp: new Date(),
      });

      logger.info({ sessionId }, 'Broadcast: session closed');
    } catch (error) {
      logger.error({ error: String(error), sessionId }, 'Failed to broadcast session closed');
      throw error;
    }
  }
}

export default NotificationService;
