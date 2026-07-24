import request from 'supertest';
import express from 'express';
import { ConflictError, NotFoundError, ForbiddenError } from '../../utils/errors';
import sessionsRouter, { serviceWrapper } from '../sessions';

let app: any;
let mockSessionService: any;

beforeEach(() => {
  app = express();
  app.use(express.json());
  app.use('/api/sessions', sessionsRouter);

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

  // Create mock SessionService
  mockSessionService = {
    createSession: jest.fn(),
    getSessionBySlug: jest.fn(),
    joinSession: jest.fn(),
    leaveSession: jest.fn(),
    closeSession: jest.fn(),
  };

  // Inject mock service
  serviceWrapper.setService(mockSessionService as any);
});

describe('Session Routes', () => {
  describe('POST /api/sessions', () => {
    it('should create a new session', async () => {
      mockSessionService.createSession.mockResolvedValue({
        id: 'session-1',
        slug: 'test-session-abc',
        name: 'Test Session',
        moderatorId: 'user1',
        description: 'Test description',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastActivityAt: new Date(),
        expiresAt: null,
      });

      const response = await request(app).post('/api/sessions').send({
        name: 'Test Session',
        moderatorId: 'user1',
        description: 'Test description',
      });

      expect(response.status).toBe(201);
      expect(response.body.slug).toBe('test-session-abc');
      expect(response.body.name).toBe('Test Session');
      expect(mockSessionService.createSession).toHaveBeenCalledWith('Test Session', 'user1', 'Test description');
    });

    it('should reject missing session name', async () => {
      const response = await request(app).post('/api/sessions').send({
        moderatorId: 'user1',
      });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_NAME');
    });

    it('should reject missing moderator ID', async () => {
      const response = await request(app).post('/api/sessions').send({
        name: 'Test Session',
      });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_MODERATOR_ID');
    });

    it('should reject session name exceeding 255 characters', async () => {
      const longName = 'a'.repeat(256);
      const response = await request(app).post('/api/sessions').send({
        name: longName,
        moderatorId: 'user1',
      });

      expect(response.status).toBe(400);
    });

    it('should accept session without description', async () => {
      mockSessionService.createSession.mockResolvedValue({
        id: 'session-2',
        slug: 'test-session-xyz',
        name: 'Session No Desc',
        moderatorId: 'user1',
        description: null,
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastActivityAt: new Date(),
        expiresAt: null,
      });

      const response = await request(app).post('/api/sessions').send({
        name: 'Session No Desc',
        moderatorId: 'user1',
      });

      expect(response.status).toBe(201);
      expect(mockSessionService.createSession).toHaveBeenCalled();
    });
  });

  describe('GET /api/sessions/:slug', () => {
    it('should retrieve a session by slug', async () => {
      const now = new Date();
      mockSessionService.getSessionBySlug.mockResolvedValue({
        id: 'session-1',
        slug: 'test-session-abc',
        name: 'Test Session',
        moderatorId: 'user1',
        description: 'Test description',
        status: 'ACTIVE',
        createdAt: now,
        lastActivityAt: now,
        updatedAt: now,
        expiresAt: null,
      });

      const response = await request(app).get('/api/sessions/test-session-abc');

      expect(response.status).toBe(200);
      expect(response.body.slug).toBe('test-session-abc');
      expect(response.body.name).toBe('Test Session');
      expect(mockSessionService.getSessionBySlug).toHaveBeenCalledWith('test-session-abc');
    });

    it('should return 404 for non-existent session', async () => {
      mockSessionService.getSessionBySlug.mockResolvedValue(null);

      const response = await request(app).get('/api/sessions/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('SESSION_NOT_FOUND');
    });
  });

  describe('POST /api/sessions/:slug/join', () => {
    it('should add a participant to a session', async () => {
      mockSessionService.getSessionBySlug.mockResolvedValue({
        id: 'session-1',
        slug: 'test-session-abc',
        name: 'Test Session',
        moderatorId: 'user1',
        description: null,
        status: 'ACTIVE',
      });

      mockSessionService.joinSession.mockResolvedValue({
        id: 'participant-1',
        sessionId: 'session-1',
        pseudonym: 'Alice',
        joinedAt: new Date(),
        lastActivityAt: new Date(),
      });

      const response = await request(app)
        .post('/api/sessions/test-session-abc/join')
        .send({ pseudonym: 'Alice' });

      expect(response.status).toBe(201);
      expect(response.body.pseudonym).toBe('Alice');
      expect(mockSessionService.joinSession).toHaveBeenCalledWith('session-1', 'Alice');
    });

    it('should return 404 if session not found', async () => {
      mockSessionService.getSessionBySlug.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/sessions/nonexistent/join')
        .send({ pseudonym: 'Alice' });

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('SESSION_NOT_FOUND');
    });

    it('should return 409 if pseudonym already exists', async () => {
      mockSessionService.getSessionBySlug.mockResolvedValue({
        id: 'session-1',
        slug: 'test-session-abc',
      });

      mockSessionService.joinSession.mockRejectedValue(
        new ConflictError('Pseudonym "Alice" already exists in this session', 'DUPLICATE_PSEUDONYM')
      );

      const response = await request(app)
        .post('/api/sessions/test-session-abc/join')
        .send({ pseudonym: 'Alice' });

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe('DUPLICATE_PSEUDONYM');
    });

    it('should reject invalid pseudonym', async () => {
      const response = await request(app)
        .post('/api/sessions/test-session-abc/join')
        .send({ pseudonym: '' });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_PSEUDONYM');
    });

    it('should reject pseudonym exceeding 50 characters', async () => {
      const longPseudonym = 'a'.repeat(51);
      const response = await request(app)
        .post('/api/sessions/test-session-abc/join')
        .send({ pseudonym: longPseudonym });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/sessions/:slug/leave', () => {
    it('should remove a participant from a session', async () => {
      mockSessionService.getSessionBySlug.mockResolvedValue({
        id: 'session-1',
        slug: 'test-session-abc',
      });

      mockSessionService.leaveSession.mockResolvedValue({
        id: 'participant-1',
        sessionId: 'session-1',
        pseudonym: 'Alice',
        joinedAt: new Date(),
        lastActivityAt: new Date(),
      });

      const response = await request(app)
        .post('/api/sessions/test-session-abc/leave')
        .send({ pseudonym: 'Alice' });

      expect(response.status).toBe(200);
      expect(response.body.pseudonym).toBe('Alice');
      expect(mockSessionService.leaveSession).toHaveBeenCalledWith('session-1', 'Alice');
    });

    it('should return 404 if session not found', async () => {
      mockSessionService.getSessionBySlug.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/sessions/nonexistent/leave')
        .send({ pseudonym: 'Alice' });

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('SESSION_NOT_FOUND');
    });

    it('should return 404 if participant not found', async () => {
      mockSessionService.getSessionBySlug.mockResolvedValue({
        id: 'session-1',
        slug: 'test-session-abc',
      });

      mockSessionService.leaveSession.mockRejectedValue(
        new NotFoundError('Participant "Unknown" not found in session', 'PARTICIPANT_NOT_FOUND')
      );

      const response = await request(app)
        .post('/api/sessions/test-session-abc/leave')
        .send({ pseudonym: 'Unknown' });

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('PARTICIPANT_NOT_FOUND');
    });

    it('should reject invalid pseudonym', async () => {
      const response = await request(app)
        .post('/api/sessions/test-session-abc/leave')
        .send({ pseudonym: '' });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/sessions/:slug/close', () => {
    it('should close a session', async () => {
      mockSessionService.getSessionBySlug.mockResolvedValue({
        id: 'session-1',
        slug: 'test-session-abc',
        moderatorId: 'user1',
      });

      mockSessionService.closeSession.mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/sessions/test-session-abc/close')
        .send({ moderatorId: 'user1' });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('CLOSED');
      expect(mockSessionService.closeSession).toHaveBeenCalledWith('session-1');
    });

    it('should return 404 if session not found', async () => {
      mockSessionService.getSessionBySlug.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/sessions/nonexistent/close')
        .send({ moderatorId: 'user1' });

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('SESSION_NOT_FOUND');
    });

    it('should return 403 if moderator ID does not match', async () => {
      mockSessionService.getSessionBySlug.mockResolvedValue({
        id: 'session-1',
        slug: 'test-session-abc',
        moderatorId: 'user1',
      });

      const response = await request(app)
        .post('/api/sessions/test-session-abc/close')
        .send({ moderatorId: 'user2' });

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('UNAUTHORIZED_MODERATOR');
    });

    it('should require moderator ID', async () => {
      mockSessionService.getSessionBySlug.mockResolvedValue({
        id: 'session-1',
        slug: 'test-session-abc',
        moderatorId: 'user1',
      });

      const response = await request(app)
        .post('/api/sessions/test-session-abc/close')
        .send({});

      expect(response.status).toBe(403);
    });
  });

  describe('Error handling', () => {
    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/sessions')
        .set('Content-Type', 'application/json')
        .send('invalid json');

      expect(response.status).toBe(400);
    });

    it('should handle service errors', async () => {
      mockSessionService.getSessionBySlug.mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/api/sessions/test-abc');

      expect(response.status).toBe(500);
    });
  });
});
