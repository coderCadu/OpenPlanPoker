import { SessionService } from '../SessionService';
import { ConflictError, NotFoundError } from '../../utils/errors';

// Mock Prisma
jest.mock('../../config/database', () => ({
  prisma: {
    session: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
    participant: {
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

const { prisma } = require('../../config/database');

describe('SessionService', () => {
  let service: SessionService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SessionService();
  });

  describe('createSession', () => {
    it('should create a new session with unique slug', async () => {
      const mockPrisma = prisma as jest.Mocked<typeof prisma>;
      mockPrisma.session.create = jest.fn().mockResolvedValue({
        id: 'session-123',
        slug: 'test-session-abc',
        name: 'Test Session',
        status: 'ACTIVE',
        moderatorId: 'user123',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastActivityAt: new Date(),
        expiresAt: null,
        description: null,
      });

      const result = await service.createSession('Test Session', 'user123', 'Optional description');

      expect(result.id).toBe('session-123');
      expect(result.slug).toBeDefined();
      expect(mockPrisma.session.create).toHaveBeenCalled();
    });

    it('should include moderatorId from current user', async () => {
      const mockPrisma = prisma as jest.Mocked<typeof prisma>;
      mockPrisma.session.create = jest.fn().mockResolvedValue({
        id: 'session-456',
        slug: 'another-session',
        name: 'Another Session',
        moderatorId: 'moderator-user',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastActivityAt: new Date(),
        expiresAt: null,
        description: null,
      });

      await service.createSession('Another Session', 'moderator-user');

      const call = (mockPrisma.session.create as jest.Mock).mock.calls[0];
      expect(call[0].data.moderatorId).toBe('moderator-user');
    });

    it('should set initial status to ACTIVE', async () => {
      const mockPrisma = prisma as jest.Mocked<typeof prisma>;
      mockPrisma.session.create = jest.fn().mockResolvedValue({
        id: 'session-789',
        slug: 'test-slug',
        name: 'Test',
        moderatorId: 'mod',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastActivityAt: new Date(),
        expiresAt: null,
        description: null,
      });

      await service.createSession('Test', 'mod');

      const call = (mockPrisma.session.create as jest.Mock).mock.calls[0];
      expect(call[0].data.status).toBe('ACTIVE');
    });
  });

  describe('joinSession', () => {
    it('should add participant to session', async () => {
      const mockPrisma = prisma as jest.Mocked<typeof prisma>;
      mockPrisma.participant.create = jest.fn().mockResolvedValue({
        id: 'participant-123',
        sessionId: 'session-123',
        pseudonym: 'Alice',
        joinedAt: new Date(),
        lastActivityAt: new Date(),
      });

      const result = await service.joinSession('session-123', 'Alice');

      expect(result.pseudonym).toBe('Alice');
      expect(mockPrisma.participant.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            sessionId: 'session-123',
            pseudonym: 'Alice',
          }),
        })
      );
    });

    it('should throw ConflictError if pseudonym already exists', async () => {
      const mockPrisma = prisma as jest.Mocked<typeof prisma>;
      mockPrisma.participant.create = jest.fn().mockRejectedValue(
        new Error('Unique constraint failed')
      );

      await expect(service.joinSession('session-123', 'Alice')).rejects.toThrow(ConflictError);
    });

    it('should update session lastActivityAt', async () => {
      const mockPrisma = prisma as jest.Mocked<typeof prisma>;
      mockPrisma.participant.create = jest.fn().mockResolvedValue({
        id: 'participant-123',
        sessionId: 'session-123',
        pseudonym: 'Bob',
        joinedAt: new Date(),
        lastActivityAt: new Date(),
      });
      mockPrisma.session.update = jest.fn().mockResolvedValue({
        id: 'session-123',
        lastActivityAt: new Date(),
      });

      await service.joinSession('session-123', 'Bob');

      expect(mockPrisma.session.update).toHaveBeenCalledWith({
        where: { id: 'session-123' },
        data: { lastActivityAt: expect.any(Date) },
      });
    });
  });

  describe('leaveSession', () => {
    it('should remove participant from session', async () => {
      const mockPrisma = prisma as jest.Mocked<typeof prisma>;
      mockPrisma.participant.delete = jest.fn().mockResolvedValue({
        id: 'participant-123',
        sessionId: 'session-123',
        pseudonym: 'Alice',
        joinedAt: new Date(),
        lastActivityAt: new Date(),
      });

      const result = await service.leaveSession('session-123', 'Alice');

      expect(result.pseudonym).toBe('Alice');
      expect(mockPrisma.participant.delete).toHaveBeenCalled();
    });

    it('should throw NotFoundError if participant not found', async () => {
      const mockPrisma = prisma as jest.Mocked<typeof prisma>;
      mockPrisma.participant.delete = jest.fn().mockRejectedValue(
        new Error('Record not found')
      );

      await expect(service.leaveSession('session-123', 'NotExist')).rejects.toThrow(NotFoundError);
    });

    it('should update session lastActivityAt', async () => {
      const mockPrisma = prisma as jest.Mocked<typeof prisma>;
      mockPrisma.participant.delete = jest.fn().mockResolvedValue({
        id: 'participant-123',
        sessionId: 'session-123',
        pseudonym: 'Bob',
        joinedAt: new Date(),
        lastActivityAt: new Date(),
      });
      mockPrisma.session.update = jest.fn().mockResolvedValue({});

      await service.leaveSession('session-123', 'Bob');

      expect(mockPrisma.session.update).toHaveBeenCalled();
    });
  });

  describe('getSession', () => {
    it('should retrieve session with all relations', async () => {
      const mockPrisma = prisma as jest.Mocked<typeof prisma>;
      mockPrisma.session.findUnique = jest.fn().mockResolvedValue({
        id: 'session-123',
        slug: 'test-session',
        name: 'Test',
        moderatorId: 'mod',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastActivityAt: new Date(),
        expiresAt: null,
        description: null,
        participants: [],
        epics: [],
        stories: [],
        tasks: [],
        votes: [],
        messages: [],
      });

      const result = await service.getSession('session-123');

      expect(result?.id).toBe('session-123');
      expect(mockPrisma.session.findUnique).toHaveBeenCalledWith({
        where: { id: 'session-123' },
        include: expect.any(Object),
      });
    });

    it('should return null if session not found', async () => {
      const mockPrisma = prisma as jest.Mocked<typeof prisma>;
      mockPrisma.session.findUnique = jest.fn().mockResolvedValue(null);

      const result = await service.getSession('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('closeSession', () => {
    it('should set session status to CLOSED', async () => {
      const mockPrisma = prisma as jest.Mocked<typeof prisma>;
      mockPrisma.session.update = jest.fn().mockResolvedValue({
        id: 'session-123',
        status: 'CLOSED',
      });

      await service.closeSession('session-123');

      expect(mockPrisma.session.update).toHaveBeenCalledWith({
        where: { id: 'session-123' },
        data: expect.objectContaining({ status: 'CLOSED' }),
      });
    });
  });

  describe('expireInactiveSessions', () => {
    it('should mark sessions inactive >30 min as archived', async () => {
      const mockPrisma = prisma as jest.Mocked<typeof prisma>;
      mockPrisma.session.updateMany = jest.fn().mockResolvedValue({ count: 2 });

      const result = await service.expireInactiveSessions();

      expect(result).toEqual({ count: 2 });
      expect(mockPrisma.session.updateMany).toHaveBeenCalledWith({
        where: expect.any(Object),
        data: expect.objectContaining({ status: 'ARCHIVED' }),
      });
    });
  });

  describe('generateUniqueSlug', () => {
    it('should generate slug in kebab-case format', async () => {
      const slug = await service.generateUniqueSlug('Test Session Name');

      expect(slug).toMatch(/^[a-z0-9-]+-[a-z0-9]{4}$/);
    });

    it('should retry on slug collision', async () => {
      const mockPrisma = prisma as jest.Mocked<typeof prisma>;
      mockPrisma.session.findUnique = jest
        .fn()
        .mockResolvedValueOnce({ id: 'existing' })
        .mockResolvedValueOnce(null);

      const slug = await service.generateUniqueSlug('Test Session Name');

      expect(slug).toBeDefined();
      expect((mockPrisma.session.findUnique as jest.Mock).mock.calls.length).toBeGreaterThanOrEqual(1);
    });

    it('should throw error after max retries', async () => {
      const mockPrisma = prisma as jest.Mocked<typeof prisma>;
      mockPrisma.session.findUnique = jest.fn().mockResolvedValue({ id: 'existing' });

      await expect(service.generateUniqueSlug('Conflict', 1)).rejects.toThrow();
    });
  });

  describe('getSessionBySlug', () => {
    it('should retrieve session by slug', async () => {
      const mockPrisma = prisma as jest.Mocked<typeof prisma>;
      mockPrisma.session.findUnique = jest.fn().mockResolvedValue({
        id: 'session-123',
        slug: 'test-session',
        name: 'Test',
        status: 'ACTIVE',
        moderatorId: 'mod',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastActivityAt: new Date(),
        expiresAt: null,
        description: null,
      });

      const result = await service.getSessionBySlug('test-session');

      expect(result?.slug).toBe('test-session');
      expect(mockPrisma.session.findUnique).toHaveBeenCalledWith({
        where: { slug: 'test-session' },
      });
    });
  });
});
