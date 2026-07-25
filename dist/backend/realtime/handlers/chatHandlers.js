"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupChatHandlers = void 0;
const logger_1 = require("../../utils/logger");
function setupChatHandlers(socket, chatService) {
    const { sessionId, pseudonym } = socket.data;
    const room = `session:${sessionId}`;
    socket.on('chat:send', async (data) => {
        try {
            const { content } = data;
            if (!content) {
                socket.emit('error:chat', { message: 'Missing message content' });
                return;
            }
            if (!chatService.validateMessage(content)) {
                socket.emit('error:chat', { message: 'Invalid message content' });
                return;
            }
            const message = await chatService.saveMessage(sessionId, pseudonym, content);
            socket.to(room).emit('message:received', {
                participantId: pseudonym,
                pseudonym,
                content: message.content,
                timestamp: message.createdAt,
            });
            socket.emit('message:sent:self', {
                participantId: pseudonym,
                pseudonym,
                content: message.content,
                timestamp: message.createdAt,
            });
            logger_1.logger.info({ sessionId, participantId: pseudonym, contentLength: content.length }, 'Chat message sent via Socket');
        }
        catch (error) {
            logger_1.logger.error({ error: String(error), sessionId, pseudonym }, 'Failed to send chat message');
            socket.emit('error:chat', {
                message: error instanceof Error ? error.message : 'Failed to send message',
            });
        }
    });
}
exports.setupChatHandlers = setupChatHandlers;
//# sourceMappingURL=chatHandlers.js.map