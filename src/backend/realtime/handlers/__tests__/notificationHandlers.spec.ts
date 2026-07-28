import { Socket } from 'socket.io';
import { setupNotificationHandlers } from '../notificationHandlers';
import { NotificationService } from '../../../services/NotificationService';
import { logger } from '../../../utils/logger';

jest.mock('../../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));
jest.mock('../../../services/NotificationService');

describe('notificationHandlers', () => {
  let socket: Partial<Socket>;
  let notificationService: jest.Mocked<NotificationService>;
  let eventListeners: Record<string, Function>;

  beforeEach(() => {
    eventListeners = {};
    const toEmit = jest.fn();
    socket = {
      data: { sessionId: 'session-123', pseudonym: 'Alice', participantId: 'participant-abc' },
      on: jest.fn((event, handler) => {
        eventListeners[event] = handler;
        return socket as any;
      }),
      to: jest.fn(() => ({
        emit: toEmit,
      } as any)),
      join: jest.fn(),
      leave: jest.fn(),
      emit: jest.fn(),
    } as any;

    notificationService = {
      broadcastParticipantJoined: jest.fn(),
      broadcastSessionClosed: jest.fn(),
    } as any;

    setupNotificationHandlers(socket as Socket, notificationService);
  });

  describe('participant:join event', () => {
    it('should broadcast participant joined', async () => {
      const handler = eventListeners['participant:join'];
      await handler();

      expect(notificationService.broadcastParticipantJoined).toHaveBeenCalledWith(
        'session-123',
        'Alice',
        'participant-abc'
      );
      expect(logger.info).toHaveBeenCalled();
    });

    it('should handle errors from NotificationService', async () => {
      notificationService.broadcastParticipantJoined.mockImplementation(() => {
        throw new Error('Broadcast failed');
      });

      const handler = eventListeners['participant:join'];
      await handler();

      expect(logger.error).toHaveBeenCalled();
      expect(socket.emit).toHaveBeenCalledWith('error:notification', {
        message: 'Broadcast failed',
      });
    });
  });

  describe('participant:leave event', () => {
    it('should emit participant left event', async () => {
      const toEmit = jest.fn();
      (socket as any).to = jest.fn(() => ({
        emit: toEmit,
      }));

      const handler = eventListeners['participant:leave'];
      await handler();

      expect(toEmit).toHaveBeenCalledWith('participant:left', {
        pseudonym: 'Alice',
        timestamp: expect.any(Date),
      });
      expect(logger.info).toHaveBeenCalled();
    });

    it('should handle errors when emitting participant left', async () => {
      (socket as any).to = jest.fn(() => {
        throw new Error('Socket error');
      });

      const handler = eventListeners['participant:leave'];
      await handler();

      expect(logger.error).toHaveBeenCalled();
      expect(socket.emit).toHaveBeenCalledWith('error:notification', {
        message: 'Socket error',
      });
    });
  });

  describe('session:close event', () => {
    it('should broadcast session closed', async () => {
      const handler = eventListeners['session:close'];
      await handler();

      expect(notificationService.broadcastSessionClosed).toHaveBeenCalledWith('session-123');
      expect(logger.info).toHaveBeenCalled();
    });

    it('should handle errors from NotificationService', async () => {
      notificationService.broadcastSessionClosed.mockImplementation(() => {
        throw new Error('Broadcast failed');
      });

      const handler = eventListeners['session:close'];
      await handler();

      expect(logger.error).toHaveBeenCalled();
      expect(socket.emit).toHaveBeenCalledWith('error:notification', {
        message: 'Broadcast failed',
      });
    });
  });

  describe('disconnect event', () => {
    it('should handle participant disconnect with delay', async () => {
      jest.useFakeTimers();
      const toEmit = jest.fn();
      (socket as any).to = jest.fn(() => ({
        emit: toEmit,
      }));

      const handler = eventListeners['disconnect'];
      handler();

      expect(logger.info).toHaveBeenCalled();

      // Advance timer by 15 seconds
      jest.advanceTimersByTime(15000);

      expect(toEmit).toHaveBeenCalledWith('participant:left', {
        pseudonym: 'Alice',
        timestamp: expect.any(Date),
      });

      jest.useRealTimers();
    });

    it('should allow reconnection within 15 second window', async () => {
      jest.useFakeTimers();
      const toEmit = jest.fn();
      (socket as any).to = jest.fn(() => ({
        emit: toEmit,
      }));

      const handler = eventListeners['disconnect'];
      handler();

      // Advance timer by 10 seconds (before 15 second timeout)
      jest.advanceTimersByTime(10000);

      expect(toEmit).not.toHaveBeenCalled();

      jest.useRealTimers();
    });
  });
});
