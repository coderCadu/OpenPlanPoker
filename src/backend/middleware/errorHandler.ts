import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { AppError, isAppError } from '../utils/errors';

/**
 * Express error handler middleware
 * Catches all errors thrown in route handlers and returns consistent JSON responses
 *
 * Usage: Register as the last middleware in your Express app
 * app.use(errorHandler);
 */
export function errorHandler(
  error: Error | unknown,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Determine status code and error details
  let status = 500;
  let errorName = 'Error';
  let message = 'An unexpected error occurred';

  if (error instanceof Error) {
    errorName = error.name;
    message = error.message || message;
  }

  if (isAppError(error)) {
    status = error.status;
  }

  // Log the error
  logger.error({
    message: error instanceof Error ? error.message : String(error),
    error: errorName,
    status,
    method: req.method,
    path: req.path,
    requestId: (req as any).id,
    timestamp: new Date().toISOString(),
  });

  // Build response
  const response: any = {
    error: errorName,
    message,
    status,
  };

  // Include request ID if available
  if ((req as any).id) {
    response.requestId = (req as any).id;
  }

  // Send response
  res.status(status).json(response);
}

/**
 * 404 handler middleware
 * Should be registered after all route handlers
 */
export function notFoundHandler(req: Request, res: Response) {
  const error = new AppError(`Route not found: ${req.method} ${req.path}`, 404, 'NOT_FOUND');
  errorHandler(error, req, res, () => {});
}

export default {
  errorHandler,
  notFoundHandler,
};
