import { ChatService } from '../ChatService';
import { ValidationError } from '../../utils/errors';

// Mock Prisma
jest.mock('../../config/database', () => ({
  prisma: {
    message: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

const { prisma } = require('../../config/database');

describe('ChatService', () => {
  let service: ChatService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ChatService();
  });

  describe('validateMessage', () => {
    it('should accept valid messages', () => {
      expect(service.validateMessage('Hello world')).toBe(true);
      expect(service.validateMessage('This is a test message')).toBe(true);
    });

    it('should reject empty messages', () => {
      expect(service.validateMessage('')).toBe(false);
    });

    it('should reject whitespace-only messages', () => {
      expect(service.validateMessage('   ')).toBe(false);
      expect(service.validateMessage('\t\n')).toBe(false);
    });

    it('should reject messages exceeding 1000 characters (input validation)', () => {
      const longMessage = 'a'.repeat(1001);
      expect(service.validateMessage(longMessage)).toBe(false);
    });

    it('should accept messages up to 1000 characters', () => {
      const longMessage = 'a'.repeat(1000);
      expect(service.validateMessage(longMessage)).toBe(true);
    });
  });

  describe('saveMessage', () => {
    it('should save a message successfully', async () => {
      const mockPrisma = prisma as jest.Mocked<typeof prisma>;
      mockPrisma.message.create = jest.fn().mockResolvedValue({
        id: 'msg-1',
        sessionId: 'session-1',
        participantId: 'participant-1',
        content: 'Hello world',
        createdAt: new Date(),
      });

      const result = await service.saveMessage('session-1', 'participant-1', 'Hello world');

      expect(result.id).toBe('msg-1');
      expect(result.content).toBe('Hello world');
      expect(mockPrisma.message.create).toHaveBeenCalled();
    });

    it('should reject empty messages', async () => {
      await expect(service.saveMessage('session-1', 'participant-1', '')).rejects.toThrow(
        ValidationError
      );
    });

    it('should reject whitespace-only messages', async () => {
      await expect(service.saveMessage('session-1', 'participant-1', '   ')).rejects.toThrow(
        ValidationError
      );
    });

    it('should truncate messages exceeding 500 characters', async () => {
      const mockPrisma = prisma as jest.Mocked<typeof prisma>;
      mockPrisma.message.create = jest.fn().mockImplementation((args) =>
        Promise.resolve({
          id: 'msg-1',
          sessionId: args.data.sessionId,
          participantId: args.data.participantId,
          content: args.data.content,
          createdAt: new Date(),
        })
      );

      const longContent = 'a'.repeat(600);
      const result = await service.saveMessage('session-1', 'participant-1', longContent);

      expect(result.content).toHaveLength(500);
      expect(result.content).toBe('a'.repeat(500));
    });

    it('should preserve messages under 500 characters', async () => {
      const mockPrisma = prisma as jest.Mocked<typeof prisma>;
      mockPrisma.message.create = jest.fn().mockImplementation((args) =>
        Promise.resolve({
          id: 'msg-1',
          sessionId: args.data.sessionId,
          participantId: args.data.participantId,
          content: args.data.content,
          createdAt: new Date(),
        })
      );

      const content = 'a'.repeat(250);
      const result = await service.saveMessage('session-1', 'participant-1', content);

      expect(result.content).toBe(content);
      expect(result.content).toHaveLength(250);
    });
  });

  describe('getSessionMessages', () => {
    it('should retrieve messages with default pagination', async () => {
      const mockPrisma = prisma as jest.Mocked<typeof prisma>;
      const messages = [
        { id: 'msg-1', sessionId: 'session-1', participantId: 'p1', content: 'First', createdAt: new Date() },
        { id: 'msg-2', sessionId: 'session-1', participantId: 'p2', content: 'Second', createdAt: new Date() },
      ];
      mockPrisma.message.findMany = jest.fn().mockResolvedValue([...messages].reverse());
      mockPrisma.message.count = jest.fn().mockResolvedValue(2);

      const result = await service.getSessionMessages('session-1');

      expect(result.messages).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(mockPrisma.message.findMany).toHaveBeenCalledWith({
        where: { sessionId: 'session-1' },
        orderBy: { createdAt: 'desc' },
        take: 50,
        skip: 0,
      });
    });

    it('should respect custom limit parameter', async () => {
      const mockPrisma = prisma as jest.Mocked<typeof prisma>;
      mockPrisma.message.findMany = jest.fn().mockResolvedValue([]);
      mockPrisma.message.count = jest.fn().mockResolvedValue(0);

      await service.getSessionMessages('session-1', 25, 0);

      expect(mockPrisma.message.findMany).toHaveBeenCalledWith({
        where: { sessionId: 'session-1' },
        orderBy: { createdAt: 'desc' },
        take: 25,
        skip: 0,
      });
    });

    it('should cap limit at 100', async () => {
      const mockPrisma = prisma as jest.Mocked<typeof prisma>;
      mockPrisma.message.findMany = jest.fn().mockResolvedValue([]);
      mockPrisma.message.count = jest.fn().mockResolvedValue(0);

      await service.getSessionMessages('session-1', 200, 0);

      expect(mockPrisma.message.findMany).toHaveBeenCalledWith({
        where: { sessionId: 'session-1' },
        orderBy: { createdAt: 'desc' },
        take: 100,
        skip: 0,
      });
    });

    it('should respect offset parameter', async () => {
      const mockPrisma = prisma as jest.Mocked<typeof prisma>;
      mockPrisma.message.findMany = jest.fn().mockResolvedValue([]);
      mockPrisma.message.count = jest.fn().mockResolvedValue(100);

      await service.getSessionMessages('session-1', 25, 50);

      expect(mockPrisma.message.findMany).toHaveBeenCalledWith({
        where: { sessionId: 'session-1' },
        orderBy: { createdAt: 'desc' },
        take: 25,
        skip: 50,
      });
    });

    it('should return empty array if no messages', async () => {
      const mockPrisma = prisma as jest.Mocked<typeof prisma>;
      mockPrisma.message.findMany = jest.fn().mockResolvedValue([]);
      mockPrisma.message.count = jest.fn().mockResolvedValue(0);

      const result = await service.getSessionMessages('session-1');

      expect(result.messages).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should return messages in chronological order', async () => {
      const mockPrisma = prisma as jest.Mocked<typeof prisma>;
      const now = new Date();
      const messages = [
        { id: 'msg-2', sessionId: 'session-1', participantId: 'p2', content: 'Second', createdAt: new Date(now.getTime() + 1000) },
        { id: 'msg-1', sessionId: 'session-1', participantId: 'p1', content: 'First', createdAt: now },
      ];
      mockPrisma.message.findMany = jest.fn().mockResolvedValue(messages);
      mockPrisma.message.count = jest.fn().mockResolvedValue(2);

      const result = await service.getSessionMessages('session-1');

      expect(result.messages[0].id).toBe('msg-1');
      expect(result.messages[1].id).toBe('msg-2');
    });

    it('should handle negative offset by normalizing to 0', async () => {
      const mockPrisma = prisma as jest.Mocked<typeof prisma>;
      mockPrisma.message.findMany = jest.fn().mockResolvedValue([]);
      mockPrisma.message.count = jest.fn().mockResolvedValue(0);

      await service.getSessionMessages('session-1', 50, -10);

      expect(mockPrisma.message.findMany).toHaveBeenCalledWith({
        where: { sessionId: 'session-1' },
        orderBy: { createdAt: 'desc' },
        take: 50,
        skip: 0,
      });
    });
  });
});
