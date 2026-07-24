"use strict";
/**
 * Custom error classes for consistent error handling across the application
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAppError = exports.InternalServerError = exports.ConflictError = exports.NotFoundError = exports.ForbiddenError = exports.UnauthorizedError = exports.ValidationError = exports.AppError = void 0;
/**
 * Base application error class
 * All application errors should inherit from this class
 */
class AppError extends Error {
    constructor(message, status = 500, code) {
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
exports.AppError = AppError;
/**
 * 400 Bad Request - Client sent invalid data
 */
class ValidationError extends AppError {
    constructor(message, code) {
        super(message, 400, code || 'VALIDATION_ERROR');
    }
}
exports.ValidationError = ValidationError;
/**
 * 401 Unauthorized - Authentication required
 */
class UnauthorizedError extends AppError {
    constructor(message, code) {
        super(message, 401, code || 'UNAUTHORIZED');
    }
}
exports.UnauthorizedError = UnauthorizedError;
/**
 * 403 Forbidden - User not authorized
 */
class ForbiddenError extends AppError {
    constructor(message, code) {
        super(message, 403, code || 'FORBIDDEN');
    }
}
exports.ForbiddenError = ForbiddenError;
/**
 * 404 Not Found - Resource does not exist
 */
class NotFoundError extends AppError {
    constructor(message, code) {
        super(message, 404, code || 'NOT_FOUND');
    }
}
exports.NotFoundError = NotFoundError;
/**
 * 409 Conflict - Resource already exists or state conflict
 */
class ConflictError extends AppError {
    constructor(message, code) {
        super(message, 409, code || 'CONFLICT');
    }
}
exports.ConflictError = ConflictError;
/**
 * 500 Internal Server Error - Server-side error
 */
class InternalServerError extends AppError {
    constructor(message, code) {
        super(message, 500, code || 'INTERNAL_SERVER_ERROR');
    }
}
exports.InternalServerError = InternalServerError;
/**
 * Type guard to check if error is an AppError
 */
function isAppError(error) {
    return error instanceof AppError;
}
exports.isAppError = isAppError;
exports.default = {
    AppError,
    ValidationError,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError,
    ConflictError,
    InternalServerError,
    isAppError,
};
//# sourceMappingURL=errors.js.map