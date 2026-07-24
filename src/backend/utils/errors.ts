/**
 * Custom error classes for consistent error handling across the application
 */

/**
 * Base application error class
 * All application errors should inherit from this class
 */
export class AppError extends Error {
  public readonly status: number;
  public readonly code?: string;

  constructor(message: string, status: number = 500, code?: string) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.code = code;

    // Maintain proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Convert error to JSON for API responses
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      status: this.status,
      ...(this.code && { code: this.code }),
    };
  }
}

/**
 * 400 Bad Request - Client sent invalid data
 */
export class ValidationError extends AppError {
  constructor(message: string, code?: string) {
    super(message, 400, code || 'VALIDATION_ERROR');
  }
}

/**
 * 401 Unauthorized - Authentication required
 */
export class UnauthorizedError extends AppError {
  constructor(message: string, code?: string) {
    super(message, 401, code || 'UNAUTHORIZED');
  }
}

/**
 * 403 Forbidden - User not authorized
 */
export class ForbiddenError extends AppError {
  constructor(message: string, code?: string) {
    super(message, 403, code || 'FORBIDDEN');
  }
}

/**
 * 404 Not Found - Resource does not exist
 */
export class NotFoundError extends AppError {
  constructor(message: string, code?: string) {
    super(message, 404, code || 'NOT_FOUND');
  }
}

/**
 * 409 Conflict - Resource already exists or state conflict
 */
export class ConflictError extends AppError {
  constructor(message: string, code?: string) {
    super(message, 409, code || 'CONFLICT');
  }
}

/**
 * 500 Internal Server Error - Server-side error
 */
export class InternalServerError extends AppError {
  constructor(message: string, code?: string) {
    super(message, 500, code || 'INTERNAL_SERVER_ERROR');
  }
}

/**
 * Type guard to check if error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export default {
  AppError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  InternalServerError,
  isAppError,
};
