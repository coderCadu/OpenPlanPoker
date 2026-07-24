import { Request, Response, NextFunction } from 'express';
import { errorHandler } from '../errorHandler';
import { AppError, NotFoundError, ValidationError } from '../../utils/errors';

// Mock logger
jest.mock('../../utils/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  },
}));

describe('Error Handler Middleware', () => {
  let mockReq: Partial<Request> & { id?: string };
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn().mockReturnValue(undefined);
    mockReq = {
      method: 'GET',
      path: '/test',
      id: 'req-123',
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jsonMock,
    };
    mockNext = jest.fn();
  });

  describe('AppError handling', () => {
    it('should catch AppError and return JSON with status', () => {
      const error = new AppError('Test error', 400);

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'AppError',
          message: 'Test error',
          status: 400,
        })
      );
    });

    it('should handle ValidationError with 400 status', () => {
      const error = new ValidationError('Invalid input');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'ValidationError',
          message: 'Invalid input',
          status: 400,
        })
      );
    });

    it('should handle NotFoundError with 404 status', () => {
      const error = new NotFoundError('Resource not found');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'NotFoundError',
          message: 'Resource not found',
          status: 404,
        })
      );
    });
  });

  describe('Generic Error handling', () => {
    it('should catch generic Error and return 500', () => {
      const error = new Error('Unexpected error');

      errorHandler(error as Error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Error',
          message: 'Unexpected error',
          status: 500,
        })
      );
    });

    it('should handle errors with no message', () => {
      const error = new Error();

      errorHandler(error as Error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalled();
    });
  });

  describe('Error response format', () => {
    it('should return consistent error response format', () => {
      const error = new AppError('Test', 403);

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      const response = jsonMock.mock.calls[0][0];

      expect(response).toHaveProperty('error');
      expect(response).toHaveProperty('message');
      expect(response).toHaveProperty('status');
    });

    it('should include request ID if present', () => {
      mockReq.id = 'req-xyz-789';
      const error = new AppError('Test', 400);

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      const response = jsonMock.mock.calls[0][0];

      expect(response.requestId).toBe('req-xyz-789');
    });
  });

  describe('Logging', () => {
    it('should log errors', () => {
      const error = new AppError('Test error', 500);
      const { logger } = require('../../utils/logger');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(logger.error).toHaveBeenCalled();
    });

    it('should include error details in logging', () => {
      const error = new AppError('Database connection failed', 500);
      const { logger } = require('../../utils/logger');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Database connection failed',
        })
      );
    });
  });

  describe('Status code mapping', () => {
    const testCases = [
      { status: 400, name: 'Bad Request' },
      { status: 401, name: 'Unauthorized' },
      { status: 403, name: 'Forbidden' },
      { status: 404, name: 'Not Found' },
      { status: 409, name: 'Conflict' },
      { status: 500, name: 'Server Error' },
    ];

    testCases.forEach(({ status, name }) => {
      it(`should return ${status} for ${name}`, () => {
        const error = new AppError(name, status);

        errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(status);
      });
    });
  });
});
