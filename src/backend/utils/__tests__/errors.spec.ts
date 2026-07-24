import { AppError, NotFoundError, ValidationError, UnauthorizedError, ConflictError } from '../errors';

describe('AppError', () => {
  describe('AppError base class', () => {
    it('should create error with message and status code', () => {
      const error = new AppError('Test error', 400);

      expect(error.message).toBe('Test error');
      expect(error.status).toBe(400);
      expect(error.name).toBe('AppError');
    });

    it('should be instanceof Error', () => {
      const error = new AppError('Test', 400);

      expect(error instanceof Error).toBe(true);
    });

    it('should have a stack trace', () => {
      const error = new AppError('Test', 400);

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('AppError');
    });

    it('should use default status code of 500 if not provided', () => {
      const error = new AppError('Server error');

      expect(error.status).toBe(500);
    });

    it('should accept optional error code', () => {
      const error = new AppError('Test', 400, 'INVALID_INPUT');

      expect(error.code).toBe('INVALID_INPUT');
    });

    it('should serialize to JSON correctly', () => {
      const error = new AppError('Test error', 400, 'TEST_ERROR');
      const json = JSON.stringify(error);
      const parsed = JSON.parse(json);

      expect(parsed.message).toBe('Test error');
      expect(parsed.status).toBe(400);
      expect(parsed.name).toBe('AppError');
    });
  });

  describe('NotFoundError', () => {
    it('should have status 404', () => {
      const error = new NotFoundError('Resource not found');

      expect(error.status).toBe(404);
      expect(error.message).toBe('Resource not found');
    });

    it('should have name NotFoundError', () => {
      const error = new NotFoundError('Not found');

      expect(error.name).toBe('NotFoundError');
    });
  });

  describe('ValidationError', () => {
    it('should have status 400', () => {
      const error = new ValidationError('Invalid input');

      expect(error.status).toBe(400);
      expect(error.message).toBe('Invalid input');
    });

    it('should have name ValidationError', () => {
      const error = new ValidationError('Invalid');

      expect(error.name).toBe('ValidationError');
    });
  });

  describe('UnauthorizedError', () => {
    it('should have status 401', () => {
      const error = new UnauthorizedError('Not authenticated');

      expect(error.status).toBe(401);
      expect(error.message).toBe('Not authenticated');
    });

    it('should have name UnauthorizedError', () => {
      const error = new UnauthorizedError('Unauthorized');

      expect(error.name).toBe('UnauthorizedError');
    });
  });

  describe('ConflictError', () => {
    it('should have status 409', () => {
      const error = new ConflictError('Resource conflict');

      expect(error.status).toBe(409);
      expect(error.message).toBe('Resource conflict');
    });

    it('should have name ConflictError', () => {
      const error = new ConflictError('Conflict');

      expect(error.name).toBe('ConflictError');
    });
  });

  describe('Error handling patterns', () => {
    it('should be catchable with try-catch', () => {
      const error = new AppError('Test', 400);
      let caught = false;

      try {
        throw error;
      } catch (e) {
        caught = true;
        expect((e as AppError).status).toBe(400);
      }

      expect(caught).toBe(true);
    });

    it('should be comparable by status code', () => {
      const errors = [
        new ValidationError('Error 1'),
        new NotFoundError('Error 2'),
        new AppError('Error 3', 500),
      ];

      const badRequests = errors.filter((e) => e.status === 400);
      expect(badRequests).toHaveLength(1);
      expect(badRequests[0].message).toBe('Error 1');
    });
  });
});
