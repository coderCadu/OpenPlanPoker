import { Socket } from 'socket.io';
import { ChatService } from '../../services/ChatService';
import { logger } from '../../utils/logger';

export function setupChatHandlers(socket: Socket, chatService: ChatService): void {
  const { sessionId, pseudonym } = socket.data;
  const room = `session:${sessionId}`;

  socket.on('chat:send', async (data: { content: string }) => {
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

      logger.info(
        { sessionId, participantId: pseudonym, contentLength: content.length },
        'Chat message sent via Socket'
      );
    } catch (error) {
      logger.error(
        { error: String(error), sessionId, pseudonym },
        'Failed to send chat message'
      );

      socket.emit('error:chat', {
        message: error instanceof Error ? error.message : 'Failed to send message',
      });
    }
  });
}
