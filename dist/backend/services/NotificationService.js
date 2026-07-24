"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const logger_1 = require("../utils/logger");
/**
 * NotificationService handles real-time notifications via Socket.io
 * Broadcasts events to session participants
 */
class NotificationService {
    constructor(io) {
        this.io = io;
    }
    /**
     * Broadcast when a participant joins a session
     * @param sessionId Session ID
     * @param pseudonym Participant's pseudonym
     */
    broadcastParticipantJoined(sessionId, pseudonym) {
        try {
            const room = `session:${sessionId}`;
            this.io.to(room).emit('participant:joined', {
                pseudonym,
                timestamp: new Date(),
            });
            logger_1.logger.info({ sessionId, pseudonym }, 'Broadcast: participant joined');
        }
        catch (error) {
            logger_1.logger.error({ error: String(error), sessionId, pseudonym }, 'Failed to broadcast participant joined');
            throw error;
        }
    }
    /**
     * Broadcast when voting starts on a task
     * @param sessionId Session ID
     * @param taskId Task ID
     * @param taskTitle Task title
     */
    broadcastVotingStarted(sessionId, taskId, taskTitle) {
        try {
            const room = `session:${sessionId}`;
            this.io.to(room).emit('voting:started', {
                taskId,
                taskTitle,
                timestamp: new Date(),
            });
            logger_1.logger.info({ sessionId, taskId }, 'Broadcast: voting started');
        }
        catch (error) {
            logger_1.logger.error({ error: String(error), sessionId, taskId }, 'Failed to broadcast voting started');
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
    broadcastVotesRevealed(sessionId, taskId, average, median) {
        try {
            const room = `session:${sessionId}`;
            this.io.to(room).emit('votes:revealed', {
                taskId,
                average,
                median,
                timestamp: new Date(),
            });
            logger_1.logger.info({ sessionId, taskId, average, median }, 'Broadcast: votes revealed');
        }
        catch (error) {
            logger_1.logger.error({ error: String(error), sessionId, taskId }, 'Failed to broadcast votes revealed');
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
    broadcastMessageSent(sessionId, participantId, pseudonym, content) {
        try {
            const room = `session:${sessionId}`;
            this.io.to(room).emit('message:sent', {
                participantId,
                pseudonym,
                content,
                timestamp: new Date(),
            });
            logger_1.logger.info({ sessionId, participantId, pseudonym }, 'Broadcast: message sent');
        }
        catch (error) {
            logger_1.logger.error({ error: String(error), sessionId, participantId }, 'Failed to broadcast message sent');
            throw error;
        }
    }
    /**
     * Broadcast when a session is closed
     * @param sessionId Session ID
     */
    broadcastSessionClosed(sessionId) {
        try {
            const room = `session:${sessionId}`;
            this.io.to(room).emit('session:closed', {
                timestamp: new Date(),
            });
            logger_1.logger.info({ sessionId }, 'Broadcast: session closed');
        }
        catch (error) {
            logger_1.logger.error({ error: String(error), sessionId }, 'Failed to broadcast session closed');
            throw error;
        }
    }
}
exports.NotificationService = NotificationService;
exports.default = NotificationService;
//# sourceMappingURL=NotificationService.js.map