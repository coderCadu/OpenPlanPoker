import request from 'supertest';
import express from 'express';
import storiesRouter, { serviceWrapper } from '../stories';
import { NotFoundError } from '../../utils/errors';

let app: any;
let mockStoryService: any;

beforeEach(() => {
  app = express();
  app.use(express.json());
  app.use('/api', storiesRouter);

  // Error handler middleware
  app.use((err: any, req: any, res: any, next: any) => {
    const status = err.status || 500;
    const message = err.message || 'Internal server error';
    const code = err.code || 'INTERNAL_ERROR';

    res.status(status).json({
      error: {
        message,
        code,
        status,
      },
    });
  });

  // Create mock StoryService
  mockStoryService = {
    createEpic: jest.fn(),
    deleteEpic: jest.fn(),
    createStory: jest.fn(),
    deleteStory: jest.fn(),
    createTask: jest.fn(),
    deleteTask: jest.fn(),
    getSessionHierarchy: jest.fn(),
    parseMarkdownImport: jest.fn(),
  };

  // Inject mock service
  serviceWrapper.setService(mockStoryService as any);
});

describe('Story Routes', () => {
  describe('POST /epics', () => {
    it('should create a new epic', async () => {
      mockStoryService.createEpic.mockResolvedValue({
        id: 'epic-1',
        sessionId: 'session-1',
        title: 'User Authentication',
        description: 'Implement login system',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const response = await request(app).post('/api/epics').send({
        sessionId: 'session-1',
        title: 'User Authentication',
        description: 'Implement login system',
      });

      expect(response.status).toBe(201);
      expect(response.body.title).toBe('User Authentication');
      expect(mockStoryService.createEpic).toHaveBeenCalledWith(
        'session-1',
        'User Authentication',
        'Implement login system'
      );
    });

    it('should reject missing session ID', async () => {
      const response = await request(app).post('/api/epics').send({
        title: 'User Authentication',
      });

      expect(response.status).toBe(400);
    });

    it('should reject missing title', async () => {
      const response = await request(app).post('/api/epics').send({
        sessionId: 'session-1',
      });

      expect(response.status).toBe(400);
    });

    it('should allow epic without description', async () => {
      mockStoryService.createEpic.mockResolvedValue({
        id: 'epic-2',
        sessionId: 'session-1',
        title: 'Epic No Desc',
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const response = await request(app).post('/api/epics').send({
        sessionId: 'session-1',
        title: 'Epic No Desc',
      });

      expect(response.status).toBe(201);
    });
  });

  describe('DELETE /epics/:epicId', () => {
    it('should delete an epic and cascade delete stories/tasks', async () => {
      mockStoryService.deleteEpic.mockResolvedValue({
        id: 'epic-1',
        sessionId: 'session-1',
        title: 'User Authentication',
      });

      const response = await request(app).delete('/api/epics/epic-1');

      expect(response.status).toBe(204);
      expect(mockStoryService.deleteEpic).toHaveBeenCalledWith('epic-1');
    });

    it('should return 404 if epic not found', async () => {
      mockStoryService.deleteEpic.mockRejectedValue(
        new NotFoundError('Epic not found: nonexistent', 'EPIC_NOT_FOUND')
      );

      const response = await request(app).delete('/api/epics/nonexistent');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /epics/:epicId/stories', () => {
    it('should create a story within an epic', async () => {
      mockStoryService.createStory.mockResolvedValue({
        id: 'story-1',
        epicId: 'epic-1',
        sessionId: 'session-1',
        title: 'User Login',
        description: 'Login with email',
        estimatePoints: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const response = await request(app)
        .post('/api/epics/epic-1/stories')
        .send({
          sessionId: 'session-1',
          title: 'User Login',
          description: 'Login with email',
        });

      expect(response.status).toBe(201);
      expect(response.body.title).toBe('User Login');
      expect(mockStoryService.createStory).toHaveBeenCalledWith(
        'session-1',
        'epic-1',
        'User Login',
        'Login with email'
      );
    });

    it('should reject missing session ID', async () => {
      const response = await request(app)
        .post('/api/epics/epic-1/stories')
        .send({
          title: 'User Login',
        });

      expect(response.status).toBe(400);
    });

    it('should reject missing story title', async () => {
      const response = await request(app)
        .post('/api/epics/epic-1/stories')
        .send({
          sessionId: 'session-1',
          description: 'Some description',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /stories/:storyId', () => {
    it('should delete a story', async () => {
      mockStoryService.deleteStory.mockResolvedValue({
        id: 'story-1',
        epicId: 'epic-1',
        title: 'User Login',
      });

      const response = await request(app).delete('/api/stories/story-1');

      expect(response.status).toBe(204);
      expect(mockStoryService.deleteStory).toHaveBeenCalledWith('story-1');
    });

    it('should return 404 if story not found', async () => {
      mockStoryService.deleteStory.mockRejectedValue(
        new NotFoundError('Story not found: nonexistent', 'STORY_NOT_FOUND')
      );

      const response = await request(app).delete('/api/stories/nonexistent');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /stories/:storyId/tasks', () => {
    it('should create a task within a story', async () => {
      mockStoryService.createTask.mockResolvedValue({
        id: 'task-1',
        storyId: 'story-1',
        sessionId: 'session-1',
        title: 'Implement login form',
        description: 'Create form with email/password',
        estimatePoints: null,
        status: 'UNESTIMATED',
        revealedAverage: null,
        revealedMedian: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const response = await request(app)
        .post('/api/stories/story-1/tasks')
        .send({
          sessionId: 'session-1',
          title: 'Implement login form',
          description: 'Create form with email/password',
        });

      expect(response.status).toBe(201);
      expect(response.body.title).toBe('Implement login form');
      expect(mockStoryService.createTask).toHaveBeenCalledWith(
        'session-1',
        'story-1',
        'Implement login form',
        'Create form with email/password'
      );
    });

    it('should reject missing session ID', async () => {
      const response = await request(app)
        .post('/api/stories/story-1/tasks')
        .send({
          title: 'Implement login form',
        });

      expect(response.status).toBe(400);
    });

    it('should reject missing task title', async () => {
      const response = await request(app)
        .post('/api/stories/story-1/tasks')
        .send({
          sessionId: 'session-1',
          description: 'Some description',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /tasks/:taskId', () => {
    it('should delete a task', async () => {
      mockStoryService.deleteTask.mockResolvedValue({
        id: 'task-1',
        storyId: 'story-1',
        title: 'Implement login form',
      });

      const response = await request(app).delete('/api/tasks/task-1');

      expect(response.status).toBe(204);
      expect(mockStoryService.deleteTask).toHaveBeenCalledWith('task-1');
    });

    it('should return 404 if task not found', async () => {
      mockStoryService.deleteTask.mockRejectedValue(
        new NotFoundError('Task not found: nonexistent', 'TASK_NOT_FOUND')
      );

      const response = await request(app).delete('/api/tasks/nonexistent');

      expect(response.status).toBe(404);
    });
  });

  describe('GET /sessions/:sessionSlug/hierarchy', () => {
    it('should retrieve full session hierarchy', async () => {
      mockStoryService.getSessionHierarchy.mockResolvedValue({
        sessionId: 'session-1',
        epics: [
          {
            id: 'epic-1',
            title: 'User Authentication',
            stories: [
              {
                id: 'story-1',
                title: 'User Login',
                estimate: 5,
                tasks: [
                  {
                    id: 'task-1',
                    title: 'Implement login form',
                    estimate: 3,
                  },
                ],
              },
            ],
          },
        ],
      });

      const response = await request(app).get(
        '/api/sessions/session-1/hierarchy'
      );

      expect(response.status).toBe(200);
      expect(response.body.epics).toHaveLength(1);
      expect(response.body.epics[0].stories).toHaveLength(1);
      expect(mockStoryService.getSessionHierarchy).toHaveBeenCalledWith(
        'session-1'
      );
    });

    it('should return 404 if session not found', async () => {
      mockStoryService.getSessionHierarchy.mockResolvedValue(null);

      const response = await request(app).get(
        '/api/sessions/nonexistent/hierarchy'
      );

      expect(response.status).toBe(404);
    });
  });

  describe('POST /sessions/:sessionSlug/import-markdown', () => {
    it('should import markdown and create hierarchy', async () => {
      mockStoryService.parseMarkdownImport.mockResolvedValue({
        epicsCreated: 1,
        storiesCreated: 2,
        tasksCreated: 3,
      });

      const markdown = `# Epic 1
## Story 1
### Task 1
### Task 2
## Story 2
### Task 3`;

      const response = await request(app)
        .post('/api/sessions/session-1/import-markdown')
        .send({
          markdown,
        });

      expect(response.status).toBe(201);
      expect(response.body.epicsCreated).toBe(1);
      expect(response.body.storiesCreated).toBe(2);
      expect(response.body.tasksCreated).toBe(3);
      expect(mockStoryService.parseMarkdownImport).toHaveBeenCalledWith(
        'session-1',
        markdown
      );
    });

    it('should reject empty markdown', async () => {
      const response = await request(app)
        .post('/api/sessions/session-1/import-markdown')
        .send({
          markdown: '',
        });

      expect(response.status).toBe(400);
    });

    it('should reject missing markdown', async () => {
      const response = await request(app)
        .post('/api/sessions/session-1/import-markdown')
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('Error handling', () => {
    it('should handle service errors', async () => {
      mockStoryService.createEpic.mockRejectedValue(
        new Error('Database error')
      );

      const response = await request(app).post('/api/epics').send({
        sessionId: 'session-1',
        title: 'Test Epic',
      });

      expect(response.status).toBe(500);
    });
  });
});
