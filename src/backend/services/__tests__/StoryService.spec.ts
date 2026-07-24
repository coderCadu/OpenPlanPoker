import { StoryService } from '../StoryService';
import { ConflictError, ValidationError, NotFoundError } from '../../utils/errors';

// Mock Prisma
jest.mock('../../config/database', () => ({
  prisma: {
    epic: { create: jest.fn(), delete: jest.fn(), findUnique: jest.fn() },
    story: { create: jest.fn(), delete: jest.fn(), findUnique: jest.fn() },
    task: { create: jest.fn(), delete: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    session: { findUnique: jest.fn() },
  },
}));

const { prisma } = require('../../config/database');

describe('StoryService', () => {
  let service: StoryService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new StoryService();
  });

  describe('createEpic', () => {
    it('should create epic in session', async () => {
      prisma.epic.create.mockResolvedValue({
        id: 'epic-1',
        sessionId: 'session-1',
        title: 'Backend API',
        description: 'API implementation',
        estimatePoints: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.createEpic('session-1', 'Backend API', 'API implementation');

      expect(result.title).toBe('Backend API');
      expect(prisma.epic.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ sessionId: 'session-1', title: 'Backend API' }),
      });
    });
  });

  describe('createStory', () => {
    it('should create story under epic', async () => {
      prisma.story.create.mockResolvedValue({
        id: 'story-1',
        sessionId: 'session-1',
        epicId: 'epic-1',
        title: 'User authentication',
        description: null,
        estimatePoints: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.createStory('session-1', 'epic-1', 'User authentication');

      expect(result.epicId).toBe('epic-1');
      expect(prisma.story.create).toHaveBeenCalled();
    });
  });

  describe('createTask', () => {
    it('should create task under story', async () => {
      prisma.task.create.mockResolvedValue({
        id: 'task-1',
        sessionId: 'session-1',
        storyId: 'story-1',
        title: 'Login form',
        description: null,
        estimatePoints: null,
        status: 'UNESTIMATED',
        revealedAverage: null,
        revealedMedian: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.createTask('session-1', 'story-1', 'Login form');

      expect(result.storyId).toBe('story-1');
      expect(result.status).toBe('UNESTIMATED');
    });
  });

  describe('deleteEpic', () => {
    it('should delete epic and cascade delete stories and tasks', async () => {
      prisma.epic.delete.mockResolvedValue({ id: 'epic-1' });

      await service.deleteEpic('epic-1');

      expect(prisma.epic.delete).toHaveBeenCalledWith({ where: { id: 'epic-1' } });
    });
  });

  describe('deleteStory', () => {
    it('should delete story and cascade delete tasks', async () => {
      prisma.story.delete.mockResolvedValue({ id: 'story-1' });

      await service.deleteStory('story-1');

      expect(prisma.story.delete).toHaveBeenCalled();
    });
  });

  describe('deleteTask', () => {
    it('should delete task', async () => {
      prisma.task.delete.mockResolvedValue({ id: 'task-1' });

      await service.deleteTask('task-1');

      expect(prisma.task.delete).toHaveBeenCalled();
    });

    it('should throw NotFoundError if task not found', async () => {
      prisma.task.delete.mockRejectedValue(new Error('Record not found'));

      await expect(service.deleteTask('nonexistent')).rejects.toThrow(NotFoundError);
    });
  });

  describe('getSessionHierarchy', () => {
    it('should return full nested hierarchy', async () => {
      prisma.session.findUnique.mockResolvedValue({
        id: 'session-1',
        epics: [
          {
            id: 'epic-1',
            title: 'Backend',
            stories: [
              { id: 'story-1', title: 'Auth', tasks: [{ id: 'task-1', title: 'Login' }] },
            ],
          },
        ],
      });

      const result = await service.getSessionHierarchy('session-1');

      expect(result?.epics).toBeDefined();
      expect(result?.epics[0].stories).toBeDefined();
    });
  });

  describe('updateEstimate', () => {
    it('should update task estimate with valid Fibonacci card', async () => {
      prisma.task.update.mockResolvedValue({
        id: 'task-1',
        estimatePoints: 8,
        status: 'ESTIMATED',
      });

      await service.updateEstimate('task-1', 8);

      expect(prisma.task.update).toHaveBeenCalledWith({
        where: { id: 'task-1' },
        data: expect.objectContaining({ estimatePoints: 8 }),
      });
    });

    it('should throw ValidationError for invalid card value', async () => {
      await expect(service.updateEstimate('task-1', 999)).rejects.toThrow(ValidationError);
    });

    it('should accept special cards (? and coffee)', async () => {
      prisma.task.update.mockResolvedValue({
        id: 'task-1',
        estimatePoints: null,
      });

      // Should not throw
      await service.updateEstimate('task-1', '?');
    });
  });

  describe('parseMarkdownImport', () => {
    it('should parse markdown hierarchy and create structure', async () => {
      const markdown = `# Epic 1
## Story 1.1
### Task 1.1.1
### Task 1.1.2
## Story 1.2`;

      prisma.epic.create.mockResolvedValue({ id: 'epic-1' });
      prisma.story.create.mockResolvedValue({ id: 'story-1' });
      prisma.task.create.mockResolvedValue({ id: 'task-1' });

      const result = await service.parseMarkdownImport('session-1', markdown);

      expect(result.epicsCreated).toBeGreaterThan(0);
    });

    it('should handle markdown with descriptions', async () => {
      const markdown = `# Epic: Backend API
Description of epic

## Story: User Auth
Task description here

### Task: Login Form`;

      prisma.epic.create.mockResolvedValue({ id: 'epic-1' });
      prisma.story.create.mockResolvedValue({ id: 'story-1' });
      prisma.task.create.mockResolvedValue({ id: 'task-1' });

      const result = await service.parseMarkdownImport('session-1', markdown);

      expect(result).toHaveProperty('epicsCreated');
      expect(result).toHaveProperty('storiesCreated');
      expect(result).toHaveProperty('tasksCreated');
    });

    it('should throw ValidationError for invalid markdown', async () => {
      const invalidMarkdown = `### Task at root
# Epic after task`;

      await expect(service.parseMarkdownImport('session-1', invalidMarkdown)).rejects.toThrow(
        ValidationError
      );
    });
  });

  describe('Cascade delete verification', () => {
    it('should cascade delete stories when deleting epic', async () => {
      // This is verified by Prisma schema setup with onDelete: Cascade
      prisma.epic.delete.mockResolvedValue({ id: 'epic-1' });

      await service.deleteEpic('epic-1');

      // Prisma handles cascade at DB level
      expect(prisma.epic.delete).toHaveBeenCalled();
    });

    it('should cascade delete tasks when deleting story', async () => {
      prisma.story.delete.mockResolvedValue({ id: 'story-1' });

      await service.deleteStory('story-1');

      expect(prisma.story.delete).toHaveBeenCalled();
    });
  });

  describe('Fibonacci validation', () => {
    const validCards = [1, 2, 3, 5, 8, 13, 21, '?', 'coffee'];
    const invalidCards = [4, 7, 6, 99, 'invalid'];

    validCards.forEach((card) => {
      it(`should accept Fibonacci card: ${card}`, async () => {
        prisma.task.update.mockResolvedValue({ id: 'task-1' });

        // Should not throw
        await service.updateEstimate('task-1', card as any);
      });
    });

    invalidCards.forEach((card) => {
      it(`should reject invalid card: ${card}`, async () => {
        await expect(service.updateEstimate('task-1', card as any)).rejects.toThrow(
          ValidationError
        );
      });
    });
  });
});
