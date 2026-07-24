import { VoteService } from '../VoteService';
import { ValidationError, ConflictError, NotFoundError } from '../../utils/errors';

// Mock Prisma
jest.mock('../../config/database', () => ({
  prisma: {
    vote: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

const { prisma } = require('../../config/database');

describe('VoteService', () => {
  let service: VoteService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new VoteService();
  });

  describe('validateCard', () => {
    it('should accept valid numeric cards', () => {
      expect(service.validateCard('1')).toBe(true);
      expect(service.validateCard('2')).toBe(true);
      expect(service.validateCard('3')).toBe(true);
      expect(service.validateCard('5')).toBe(true);
      expect(service.validateCard('8')).toBe(true);
      expect(service.validateCard('13')).toBe(true);
      expect(service.validateCard('21')).toBe(true);
    });

    it('should accept special cards', () => {
      expect(service.validateCard('?')).toBe(true);
      expect(service.validateCard('☕')).toBe(true);
    });

    it('should reject invalid cards', () => {
      expect(service.validateCard('0')).toBe(false);
      expect(service.validateCard('4')).toBe(false);
      expect(service.validateCard('invalid')).toBe(false);
      expect(service.validateCard('coffee')).toBe(false);
      expect(service.validateCard('')).toBe(false);
    });
  });

  describe('recordVote', () => {
    it('should record a vote successfully', async () => {
      const mockPrisma = prisma as jest.Mocked<typeof prisma>;
      mockPrisma.vote.findUnique = jest.fn().mockResolvedValue(null);
      mockPrisma.vote.create = jest.fn().mockResolvedValue({
        id: 'vote-123',
        taskId: 'task-1',
        participantId: 'participant-1',
        sessionId: 'session-1',
        card: '5',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.recordVote('task-1', 'participant-1', 'session-1', '5');

      expect(result.id).toBe('vote-123');
      expect(result.card).toBe('5');
      expect(mockPrisma.vote.create).toHaveBeenCalled();
    });

    it('should reject invalid card', async () => {
      await expect(service.recordVote('task-1', 'participant-1', 'session-1', 'invalid')).rejects.toThrow(ValidationError);
    });

    it('should reject duplicate vote', async () => {
      const mockPrisma = prisma as jest.Mocked<typeof prisma>;
      mockPrisma.vote.findUnique = jest.fn().mockResolvedValue({
        id: 'vote-existing',
        taskId: 'task-1',
        participantId: 'participant-1',
        sessionId: 'session-1',
        card: '3',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(service.recordVote('task-1', 'participant-1', 'session-1', '5')).rejects.toThrow(ConflictError);
    });

    it('should accept all valid cards', async () => {
      const mockPrisma = prisma as jest.Mocked<typeof prisma>;
      mockPrisma.vote.findUnique = jest.fn().mockResolvedValue(null);
      mockPrisma.vote.create = jest.fn().mockResolvedValue({
        id: 'vote-new',
        taskId: 'task-1',
        participantId: 'participant-1',
        sessionId: 'session-1',
        card: '?',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.recordVote('task-1', 'participant-1', 'session-1', '?');
      expect(result.card).toBe('?');
    });
  });

  describe('updateVote', () => {
    it('should update vote successfully', async () => {
      const mockPrisma = prisma as jest.Mocked<typeof prisma>;
      mockPrisma.vote.findUnique = jest.fn().mockResolvedValue({
        id: 'vote-123',
        taskId: 'task-1',
        participantId: 'participant-1',
        sessionId: 'session-1',
        card: '3',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockPrisma.vote.update = jest.fn().mockResolvedValue({
        id: 'vote-123',
        taskId: 'task-1',
        participantId: 'participant-1',
        sessionId: 'session-1',
        card: '8',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.updateVote('vote-123', '8');

      expect(result.card).toBe('8');
      expect(mockPrisma.vote.update).toHaveBeenCalled();
    });

    it('should reject invalid card on update', async () => {
      const mockPrisma = prisma as jest.Mocked<typeof prisma>;
      mockPrisma.vote.findUnique = jest.fn().mockResolvedValue({
        id: 'vote-123',
        taskId: 'task-1',
        participantId: 'participant-1',
        sessionId: 'session-1',
        card: '5',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(service.updateVote('vote-123', 'invalid')).rejects.toThrow(ValidationError);
    });

    it('should throw NotFoundError if vote not found', async () => {
      const mockPrisma = prisma as jest.Mocked<typeof prisma>;
      mockPrisma.vote.findUnique = jest.fn().mockResolvedValue(null);

      await expect(service.updateVote('nonexistent', '5')).rejects.toThrow(NotFoundError);
    });
  });

  describe('getAllVotes', () => {
    it('should return all votes for a task', async () => {
      const mockPrisma = prisma as jest.Mocked<typeof prisma>;
      const votes = [
        { id: 'vote-1', taskId: 'task-1', participantId: 'p1', sessionId: 's1', card: '5', createdAt: new Date(), updatedAt: new Date() },
        { id: 'vote-2', taskId: 'task-1', participantId: 'p2', sessionId: 's1', card: '8', createdAt: new Date(), updatedAt: new Date() },
      ];
      mockPrisma.vote.findMany = jest.fn().mockResolvedValue(votes);

      const result = await service.getAllVotes('task-1');

      expect(result).toHaveLength(2);
      expect(mockPrisma.vote.findMany).toHaveBeenCalled();
    });

    it('should return empty array if no votes', async () => {
      const mockPrisma = prisma as jest.Mocked<typeof prisma>;
      mockPrisma.vote.findMany = jest.fn().mockResolvedValue([]);

      const result = await service.getAllVotes('task-1');

      expect(result).toHaveLength(0);
    });
  });

  describe('calculateAverage', () => {
    it('should calculate average of numeric votes', () => {
      const votes = [
        { card: '5', id: 'v1', taskId: 't1', participantId: 'p1', sessionId: 's1', createdAt: new Date(), updatedAt: new Date() },
        { card: '8', id: 'v2', taskId: 't1', participantId: 'p2', sessionId: 's1', createdAt: new Date(), updatedAt: new Date() },
        { card: '3', id: 'v3', taskId: 't1', participantId: 'p3', sessionId: 's1', createdAt: new Date(), updatedAt: new Date() },
      ];

      const average = service.calculateAverage(votes);

      expect(average).toBe((5 + 8 + 3) / 3); // 16/3 ≈ 5.33
    });

    it('should ignore special cards when calculating average', () => {
      const votes = [
        { card: '5', id: 'v1', taskId: 't1', participantId: 'p1', sessionId: 's1', createdAt: new Date(), updatedAt: new Date() },
        { card: '?', id: 'v2', taskId: 't1', participantId: 'p2', sessionId: 's1', createdAt: new Date(), updatedAt: new Date() },
        { card: '8', id: 'v3', taskId: 't1', participantId: 'p3', sessionId: 's1', createdAt: new Date(), updatedAt: new Date() },
      ];

      const average = service.calculateAverage(votes);

      expect(average).toBe((5 + 8) / 2); // 6.5
    });

    it('should ignore coffee card when calculating average', () => {
      const votes = [
        { card: '3', id: 'v1', taskId: 't1', participantId: 'p1', sessionId: 's1', createdAt: new Date(), updatedAt: new Date() },
        { card: '☕', id: 'v2', taskId: 't1', participantId: 'p2', sessionId: 's1', createdAt: new Date(), updatedAt: new Date() },
        { card: '5', id: 'v3', taskId: 't1', participantId: 'p3', sessionId: 's1', createdAt: new Date(), updatedAt: new Date() },
      ];

      const average = service.calculateAverage(votes);

      expect(average).toBe((3 + 5) / 2); // 4
    });

    it('should return null if only special cards', () => {
      const votes = [
        { card: '?', id: 'v1', taskId: 't1', participantId: 'p1', sessionId: 's1', createdAt: new Date(), updatedAt: new Date() },
        { card: '☕', id: 'v2', taskId: 't1', participantId: 'p2', sessionId: 's1', createdAt: new Date(), updatedAt: new Date() },
      ];

      const average = service.calculateAverage(votes);

      expect(average).toBeNull();
    });

    it('should return null if no votes', () => {
      const average = service.calculateAverage([]);

      expect(average).toBeNull();
    });
  });

  describe('calculateMedian', () => {
    it('should calculate median of odd number of votes', () => {
      const votes = [
        { card: '3', id: 'v1', taskId: 't1', participantId: 'p1', sessionId: 's1', createdAt: new Date(), updatedAt: new Date() },
        { card: '5', id: 'v2', taskId: 't1', participantId: 'p2', sessionId: 's1', createdAt: new Date(), updatedAt: new Date() },
        { card: '8', id: 'v3', taskId: 't1', participantId: 'p3', sessionId: 's1', createdAt: new Date(), updatedAt: new Date() },
      ];

      const median = service.calculateMedian(votes);

      expect(median).toBe(5);
    });

    it('should calculate median of even number of votes', () => {
      const votes = [
        { card: '3', id: 'v1', taskId: 't1', participantId: 'p1', sessionId: 's1', createdAt: new Date(), updatedAt: new Date() },
        { card: '5', id: 'v2', taskId: 't1', participantId: 'p2', sessionId: 's1', createdAt: new Date(), updatedAt: new Date() },
        { card: '8', id: 'v3', taskId: 't1', participantId: 'p3', sessionId: 's1', createdAt: new Date(), updatedAt: new Date() },
        { card: '13', id: 'v4', taskId: 't1', participantId: 'p4', sessionId: 's1', createdAt: new Date(), updatedAt: new Date() },
      ];

      const median = service.calculateMedian(votes);

      expect(median).toBe((5 + 8) / 2); // 6.5
    });

    it('should ignore special cards when calculating median', () => {
      const votes = [
        { card: '3', id: 'v1', taskId: 't1', participantId: 'p1', sessionId: 's1', createdAt: new Date(), updatedAt: new Date() },
        { card: '?', id: 'v2', taskId: 't1', participantId: 'p2', sessionId: 's1', createdAt: new Date(), updatedAt: new Date() },
        { card: '8', id: 'v3', taskId: 't1', participantId: 'p3', sessionId: 's1', createdAt: new Date(), updatedAt: new Date() },
      ];

      const median = service.calculateMedian(votes);

      expect(median).toBe((3 + 8) / 2); // 5.5
    });

    it('should return null if only special cards', () => {
      const votes = [
        { card: '?', id: 'v1', taskId: 't1', participantId: 'p1', sessionId: 's1', createdAt: new Date(), updatedAt: new Date() },
        { card: '☕', id: 'v2', taskId: 't1', participantId: 'p2', sessionId: 's1', createdAt: new Date(), updatedAt: new Date() },
      ];

      const median = service.calculateMedian(votes);

      expect(median).toBeNull();
    });

    it('should return null if no votes', () => {
      const median = service.calculateMedian([]);

      expect(median).toBeNull();
    });
  });

  describe('hasAllVoted', () => {
    it('should return true if all participants voted', async () => {
      const mockPrisma = prisma as jest.Mocked<typeof prisma>;
      mockPrisma.vote.count = jest.fn().mockResolvedValue(3);

      const result = await service.hasAllVoted('task-1', 3);

      expect(result).toBe(true);
    });

    it('should return false if not all participants voted', async () => {
      const mockPrisma = prisma as jest.Mocked<typeof prisma>;
      mockPrisma.vote.count = jest.fn().mockResolvedValue(2);

      const result = await service.hasAllVoted('task-1', 3);

      expect(result).toBe(false);
    });

    it('should return true if more participants voted than expected', async () => {
      const mockPrisma = prisma as jest.Mocked<typeof prisma>;
      mockPrisma.vote.count = jest.fn().mockResolvedValue(5);

      const result = await service.hasAllVoted('task-1', 3);

      expect(result).toBe(true);
    });
  });
});
