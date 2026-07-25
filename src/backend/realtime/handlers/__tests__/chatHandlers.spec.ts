import { Socket } from 'socket.io';
import { setupChatHandlers } from '../chatHandlers';
import { ChatService } from '../../../services/ChatService';
import { logger } from '../../../utils/logger';

jest.mock('../../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));
jest.mock('../../../services/ChatService');

describe('chatHandlers', () => {
  let socket: Partial<Socket>;
  let chatService: jest.Mocked<ChatService>;
  let eventListeners: Record<string, Function>;

  beforeEach(() => {
    eventListeners = {};
    const toEmit = jest.fn();
    socket = {
      data: { sessionId: 'session-123', pseudonym: 'Alice' },
      on: jest.fn((event, handler) => {
        eventListeners[event] = handler;
        return socket as any;
      }),
      to: jest.fn(() => ({
        emit: toEmit,
      } as any)),
      emit: jest.fn(),
    } as any;

    chatService = {
      validateMessage: jest.fn().mockReturnValue(true),
      saveMessage: jest.fn(),
    } as any;

    setupChatHandlers(socket as Socket, chatService);
  });

  describe('chat:send event', () => {
    it('should save message and emit to room', async () => {
      const mockMessage = {
        id: 'msg-1',
        sessionId: 'session-123',
        participantId: 'Alice',
        content: 'Hello everyone',
        createdAt: new Date(),
      };

      chatService.saveMessage.mockResolvedValue(mockMessage);
      const toEmit = jest.fn();
      (socket.to as jest.Mock).mockReturnValue({ emit: toEmit });

      const handler = eventListeners['chat:send'];
      await handler({ content: 'Hello everyone' });

      expect(chatService.validateMessage).toHaveBeenCalledWith('Hello everyone');
      expect(chatService.saveMessage).toHaveBeenCalledWith('session-123', 'Alice', 'Hello everyone');
      expect(toEmit).toHaveBeenCalledWith('message:received', {
        participantId: 'Alice',
        pseudonym: 'Alice',
        content: 'Hello everyone',
        timestamp: expect.any(Date),
      });
      expect(socket.emit).toHaveBeenCalledWith('message:sent:self', {
        participantId: 'Alice',
        pseudonym: 'Alice',
        content: 'Hello everyone',
        timestamp: expect.any(Date),
      });
    });

    it('should reject invalid message', async () => {
      chatService.validateMessage.mockReturnValue(false);

      const handler = eventListeners['chat:send'];
      await handler({ content: '' });

      expect(socket.emit).toHaveBeenCalledWith('error:chat', { message: 'Invalid message content' });
      expect(chatService.saveMessage).not.toHaveBeenCalled();
    });

    it('should reject message without content', async () => {
      const handler = eventListeners['chat:send'];
      await handler({});

      expect(socket.emit).toHaveBeenCalledWith('error:chat', { message: 'Missing message content' });
    });

    it('should handle oversized messages', async () => {
      const longMessage = 'x'.repeat(1001);
      chatService.validateMessage.mockReturnValue(false);

      const handler = eventListeners['chat:send'];
      await handler({ content: longMessage });

      expect(socket.emit).toHaveBeenCalledWith('error:chat', { message: 'Invalid message content' });
    });

    it('should handle errors from ChatService', async () => {
      chatService.validateMessage.mockReturnValue(true);
      chatService.saveMessage.mockRejectedValue(new Error('Database error'));

      const handler = eventListeners['chat:send'];
      await handler({ content: 'Test message' });

      expect(socket.emit).toHaveBeenCalledWith('error:chat', { message: 'Database error' });
    });

    it('should log when message is sent', async () => {
      const mockMessage = {
        id: 'msg-1',
        sessionId: 'session-123',
        participantId: 'Alice',
        content: 'Test',
        createdAt: new Date(),
      };

      chatService.saveMessage.mockResolvedValue(mockMessage);
      (socket.to as jest.Mock).mockReturnValue({ emit: jest.fn() });

      const handler = eventListeners['chat:send'];
      await handler({ content: 'Test' });

      expect(logger.info).toHaveBeenCalled();
    });
  });
});
