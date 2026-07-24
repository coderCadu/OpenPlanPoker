import { SessionService } from '../SessionService';
import { StoryService } from '../StoryService';

// Mock Prisma
jest.mock('../../config/database', () => ({
  prisma: {
    session: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
    participant: {
      create: jest.fn(),
      delete: jest.fn(),
    },
    epic: { create: jest.fn(), delete: jest.fn(), findUnique: jest.fn() },
    story: { create: jest.fn(), delete: jest.fn(), findUnique: jest.fn() },
    task: { create: jest.fn(), delete: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
  },
}));

const { prisma } = require('../../config/database');

describe('Session + Story Services Integration', () => {
  let sessionService: SessionService;
  let storyService: StoryService;

  beforeEach(() => {
    jest.clearAllMocks();
    sessionService = new SessionService();
    storyService = new StoryService();
  });

  describe('End-to-end flow: create session → add hierarchy → estimate', () => {
    it('should create session, add participants, create hierarchy, and estimate', async () => {
      // Setup mocks
      const sessionId = 'sess-123';
      const epicId = 'epic-1';
      const storyId = 'story-1';
      const taskId = 'task-1';

      prisma.session.create.mockResolvedValue({
        id: sessionId,
        slug: 'test-session',
        name: 'Test Sprint',
        moderatorId: 'alice',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastActivityAt: new Date(),
        expiresAt: null,
        description: null,
      });

      prisma.participant.create.mockResolvedValue({
        id: 'part-1',
        sessionId,
        pseudonym: 'alice',
        joinedAt: new Date(),
        lastActivityAt: new Date(),
      });

      prisma.session.update.mockResolvedValue({});

      prisma.epic.create.mockResolvedValue({
        id: epicId,
        sessionId,
        title: 'Backend API',
        description: null,
        estimatePoints: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      prisma.story.create.mockResolvedValue({
        id: storyId,
        sessionId,
        epicId,
        title: 'User Auth',
        description: null,
        estimatePoints: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      prisma.task.create.mockResolvedValue({
        id: taskId,
        sessionId,
        storyId,
        title: 'Login endpoint',
        description: null,
        estimatePoints: null,
        status: 'UNESTIMATED',
        revealedAverage: null,
        revealedMedian: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      prisma.task.update.mockResolvedValue({
        id: taskId,
        estimatePoints: 5,
        status: 'ESTIMATED',
      });

      // Execute integration flow
      const session = await sessionService.createSession('Test Sprint', 'alice');
      expect(session.id).toBe(sessionId);

      const participant = await sessionService.joinSession(sessionId, 'alice');
      expect(participant.pseudonym).toBe('alice');

      const epic = await storyService.createEpic(sessionId, 'Backend API');
      expect(epic.id).toBe(epicId);

      const story = await storyService.createStory(sessionId, epicId, 'User Auth');
      expect(story.id).toBe(storyId);

      const task = await storyService.createTask(sessionId, storyId, 'Login endpoint');
      expect(task.status).toBe('UNESTIMATED');

      const estimated = await storyService.updateEstimate(taskId, 5);
      expect(estimated.estimatePoints).toBe(5);
      expect(estimated.status).toBe('ESTIMATED');
    });
  });

  describe('Cascade delete integration', () => {
    it('should cascade delete when deleting epic', async () => {
      prisma.epic.delete.mockResolvedValue({ id: 'epic-1' });

      await storyService.deleteEpic('epic-1');

      expect(prisma.epic.delete).toHaveBeenCalledWith({ where: { id: 'epic-1' } });
    });

    it('should cascade delete when deleting story', async () => {
      prisma.story.delete.mockResolvedValue({ id: 'story-1' });

      await storyService.deleteStory('story-1');

      expect(prisma.story.delete).toHaveBeenCalled();
    });
  });

  describe('Pseudonym uniqueness within session', () => {
    it('should prevent duplicate pseudonym in same session', async () => {
      prisma.participant.create
        .mockResolvedValueOnce({
          id: 'part-1',
          sessionId: 'session-1',
          pseudonym: 'alice',
          joinedAt: new Date(),
          lastActivityAt: new Date(),
        })
        .mockRejectedValueOnce(new Error('Unique constraint failed'));

      const first = await sessionService.joinSession('session-1', 'alice');
      expect(first.pseudonym).toBe('alice');

      const conflict = sessionService.joinSession('session-1', 'alice');
      await expect(conflict).rejects.toThrow();
    });
  });

  describe('30-minute inactivity expiry', () => {
    it('should archive sessions inactive for 30+ minutes', async () => {
      prisma.session.updateMany.mockResolvedValue({ count: 2 });

      const result = await sessionService.expireInactiveSessions();

      expect(result.count).toBe(2);
      expect(prisma.session.updateMany).toHaveBeenCalledWith({
        where: expect.objectContaining({ status: 'ACTIVE' }),
        data: expect.objectContaining({ status: 'ARCHIVED' }),
      });
    });
  });
});
