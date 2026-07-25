"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupNotificationHandlers = void 0;
const logger_1 = require("../../utils/logger");
function setupNotificationHandlers(socket, notificationService) {
    const { sessionId, pseudonym } = socket.data;
    const room = `session:${sessionId}`;
    socket.on('participant:join', async () => {
        try {
            notificationService.broadcastParticipantJoined(sessionId, pseudonym);
            logger_1.logger.info({ sessionId, pseudonym }, 'Participant join notification sent via Socket');
        }
        catch (error) {
            logger_1.logger.error({ error: String(error), sessionId, pseudonym }, 'Failed to broadcast participant joined');
            socket.emit('error:notification', {
                message: error instanceof Error ? error.message : 'Failed to notify participant join',
            });
        }
    });
    socket.on('participant:leave', async () => {
        try {
            socket.to(room).emit('participant:left', {
                pseudonym,
                timestamp: new Date(),
            });
            logger_1.logger.info({ sessionId, pseudonym }, 'Participant leave notification sent via Socket');
        }
        catch (error) {
            logger_1.logger.error({ error: String(error), sessionId, pseudonym }, 'Failed to emit participant left event');
            socket.emit('error:notification', {
                message: error instanceof Error ? error.message : 'Failed to notify participant leave',
            });
        }
    });
    socket.on('session:close', async () => {
        try {
            notificationService.broadcastSessionClosed(sessionId);
            logger_1.logger.info({ sessionId }, 'Session close notification sent via Socket');
        }
        catch (error) {
            logger_1.logger.error({ error: String(error), sessionId }, 'Failed to broadcast session closed');
            socket.emit('error:notification', {
                message: error instanceof Error ? error.message : 'Failed to notify session close',
            });
        }
    });
    let disconnectTimeout;
    socket.on('disconnect', () => {
        logger_1.logger.info({ sessionId, pseudonym }, 'Participant disconnected');
        // Allow 15 second window for reconnection before broadcasting leave
        disconnectTimeout = setTimeout(() => {
            socket.to(room).emit('participant:left', {
                pseudonym,
                timestamp: new Date(),
            });
            logger_1.logger.info({ sessionId, pseudonym }, 'Participant confirmed left after disconnect');
        }, 15000);
    });
    // Cancel timeout if reconnection happens within 15 seconds
    socket.on('connect', () => {
        if (disconnectTimeout) {
            clearTimeout(disconnectTimeout);
        }
    });
}
exports.setupNotificationHandlers = setupNotificationHandlers;
//# sourceMappingURL=notificationHandlers.js.map