/**
 * Custom error classes for consistent error handling across the application
 */
/**
 * Base application error class
 * All application errors should inherit from this class
 */
export declare class AppError extends Error {
    readonly status: number;
    readonly code?: string;
    constructor(message: string, status?: number, code?: string);
    /**
     * Convert error to JSON for API responses
     */
    toJSON(): {
        code?: string | undefined;
        name: string;
        message: string;
        status: number;
    };
}
/**
 * 400 Bad Request - Client sent invalid data
 */
export declare class ValidationError extends AppError {
    constructor(message: string, code?: string);
}
/**
 * 401 Unauthorized - Authentication required
 */
export declare class UnauthorizedError extends AppError {
    constructor(message: string, code?: string);
}
/**
 * 403 Forbidden - User not authorized
 */
export declare class ForbiddenError extends AppError {
    constructor(message: string, code?: string);
}
/**
 * 404 Not Found - Resource does not exist
 */
export declare class NotFoundError extends AppError {
    constructor(message: string, code?: string);
}
/**
 * 409 Conflict - Resource already exists or state conflict
 */
export declare class ConflictError extends AppError {
    constructor(message: string, code?: string);
}
/**
 * 500 Internal Server Error - Server-side error
 */
export declare class InternalServerError extends AppError {
    constructor(message: string, code?: string);
}
/**
 * Type guard to check if error is an AppError
 */
export declare function isAppError(error: unknown): error is AppError;
declare const _default: {
    AppError: typeof AppError;
    ValidationError: typeof ValidationError;
    UnauthorizedError: typeof UnauthorizedError;
    ForbiddenError: typeof ForbiddenError;
    NotFoundError: typeof NotFoundError;
    ConflictError: typeof ConflictError;
    InternalServerError: typeof InternalServerError;
    isAppError: typeof isAppError;
};
export default _default;
//# sourceMappingURL=errors.d.ts.map