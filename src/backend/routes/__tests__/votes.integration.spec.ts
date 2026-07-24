import request from 'supertest';
import express from 'express';
import votesRouter, { serviceWrapper } from '../votes';
import { ValidationError, NotFoundError, ConflictError } from '../../utils/errors';

let app: any;
let mockVoteService: any;

beforeEach(() => {
  app = express();
  app.use(express.json());
  app.use('/api', votesRouter);

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

  // Create mock VoteService
  mockVoteService = {
    recordVote: jest.fn(),
    updateVote: jest.fn(),
    getAllVotes: jest.fn(),
    calculateAverage: jest.fn(),
    calculateMedian: jest.fn(),
  };

  // Inject mock service
  serviceWrapper.setService(mockVoteService as any);
});

describe('Vote Routes', () => {
  describe('POST /tasks/:taskId/vote', () => {
    it('should record a vote', async () => {
      mockVoteService.recordVote.mockResolvedValue({
        id: 'vote-1',
        taskId: 'task-1',
        participantId: 'participant-1',
        sessionId: 'session-1',
        card: '5',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const response = await request(app)
        .post('/api/tasks/task-1/vote')
        .send({
          participantId: 'participant-1',
          sessionId: 'session-1',
          card: '5',
        });

      expect(response.status).toBe(201);
      expect(response.body.card).toBe('5');
      expect(mockVoteService.recordVote).toHaveBeenCalledWith(
        'task-1',
        'participant-1',
        'session-1',
        '5'
      );
    });

    it('should reject invalid card', async () => {
      mockVoteService.recordVote.mockRejectedValue(
        new ValidationError('Invalid card: invalid', 'INVALID_CARD')
      );

      const response = await request(app)
        .post('/api/tasks/task-1/vote')
        .send({
          participantId: 'participant-1',
          sessionId: 'session-1',
          card: 'invalid',
        });

      expect(response.status).toBe(400);
    });

    it('should reject missing participant ID', async () => {
      const response = await request(app)
        .post('/api/tasks/task-1/vote')
        .send({
          sessionId: 'session-1',
          card: '5',
        });

      expect(response.status).toBe(400);
    });

    it('should reject missing card', async () => {
      const response = await request(app)
        .post('/api/tasks/task-1/vote')
        .send({
          participantId: 'participant-1',
          sessionId: 'session-1',
        });

      expect(response.status).toBe(400);
    });

    it('should return 409 for duplicate vote', async () => {
      mockVoteService.recordVote.mockRejectedValue(
        new ConflictError(
          'Participant has already voted on this task',
          'DUPLICATE_VOTE'
        )
      );

      const response = await request(app)
        .post('/api/tasks/task-1/vote')
        .send({
          participantId: 'participant-1',
          sessionId: 'session-1',
          card: '5',
        });

      expect(response.status).toBe(409);
    });
  });

  describe('PUT /votes/:voteId', () => {
    it('should update a vote before reveal', async () => {
      mockVoteService.updateVote.mockResolvedValue({
        id: 'vote-1',
        taskId: 'task-1',
        participantId: 'participant-1',
        sessionId: 'session-1',
        card: '8',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const response = await request(app)
        .put('/api/votes/vote-1')
        .send({
          card: '8',
        });

      expect(response.status).toBe(200);
      expect(response.body.card).toBe('8');
      expect(mockVoteService.updateVote).toHaveBeenCalledWith('vote-1', '8');
    });

    it('should reject invalid card update', async () => {
      mockVoteService.updateVote.mockRejectedValue(
        new ValidationError('Invalid card: abc', 'INVALID_CARD')
      );

      const response = await request(app)
        .put('/api/votes/vote-1')
        .send({
          card: 'abc',
        });

      expect(response.status).toBe(400);
    });

    it('should return 404 if vote not found', async () => {
      mockVoteService.updateVote.mockRejectedValue(
        new NotFoundError('Vote not found', 'VOTE_NOT_FOUND')
      );

      const response = await request(app)
        .put('/api/votes/nonexistent')
        .send({
          card: '5',
        });

      expect(response.status).toBe(404);
    });
  });

  describe('GET /tasks/:taskId/votes', () => {
    it('should retrieve votes for a task (after reveal)', async () => {
      mockVoteService.getAllVotes.mockResolvedValue([
        {
          id: 'vote-1',
          taskId: 'task-1',
          participantId: 'participant-1',
          sessionId: 'session-1',
          card: '5',
          createdAt: new Date(),
        },
        {
          id: 'vote-2',
          taskId: 'task-1',
          participantId: 'participant-2',
          sessionId: 'session-1',
          card: '8',
          createdAt: new Date(),
        },
      ]);

      const response = await request(app).get('/api/tasks/task-1/votes');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].card).toBe('5');
      expect(response.body[1].card).toBe('8');
      expect(mockVoteService.getAllVotes).toHaveBeenCalledWith('task-1');
    });

    it('should return empty array if no votes', async () => {
      mockVoteService.getAllVotes.mockResolvedValue([]);

      const response = await request(app).get('/api/tasks/task-1/votes');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(0);
    });
  });

  describe('POST /tasks/:taskId/reveal', () => {
    it('should reveal votes and calculate statistics', async () => {
      mockVoteService.getAllVotes.mockResolvedValue([
        {
          id: 'vote-1',
          taskId: 'task-1',
          participantId: 'p1',
          sessionId: 'session-1',
          card: '5',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'vote-2',
          taskId: 'task-1',
          participantId: 'p2',
          sessionId: 'session-1',
          card: '8',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'vote-3',
          taskId: 'task-1',
          participantId: 'p3',
          sessionId: 'session-1',
          card: '5',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      mockVoteService.calculateAverage.mockReturnValue(6);
      mockVoteService.calculateMedian.mockReturnValue(5);

      const response = await request(app)
        .post('/api/tasks/task-1/reveal')
        .send({
          sessionId: 'session-1',
        });

      expect(response.status).toBe(200);
      expect(response.body.average).toBe(6);
      expect(response.body.median).toBe(5);
      expect(response.body.votes).toHaveLength(3);
      expect(mockVoteService.getAllVotes).toHaveBeenCalledWith('task-1');
    });

    it('should handle votes with special cards', async () => {
      mockVoteService.getAllVotes.mockResolvedValue([
        {
          id: 'vote-1',
          taskId: 'task-1',
          participantId: 'p1',
          sessionId: 'session-1',
          card: '5',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'vote-2',
          taskId: 'task-1',
          participantId: 'p2',
          sessionId: 'session-1',
          card: '?',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'vote-3',
          taskId: 'task-1',
          participantId: 'p3',
          sessionId: 'session-1',
          card: '☕',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      mockVoteService.calculateAverage.mockReturnValue(5);
      mockVoteService.calculateMedian.mockReturnValue(5);

      const response = await request(app)
        .post('/api/tasks/task-1/reveal')
        .send({
          sessionId: 'session-1',
        });

      expect(response.status).toBe(200);
      expect(response.body.average).toBe(5);
    });
  });


  describe('Error handling', () => {
    it('should handle service errors', async () => {
      mockVoteService.recordVote.mockRejectedValue(
        new Error('Database error')
      );

      const response = await request(app)
        .post('/api/tasks/task-1/vote')
        .send({
          participantId: 'participant-1',
          sessionId: 'session-1',
          card: '5',
        });

      expect(response.status).toBe(500);
    });
  });
});
