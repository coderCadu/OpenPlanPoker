import { Request, Response, NextFunction } from 'express';
/**
 * Express error handler middleware
 * Catches all errors thrown in route handlers and returns consistent JSON responses
 *
 * Usage: Register as the last middleware in your Express app
 * app.use(errorHandler);
 */
export declare function errorHandler(error: Error | unknown, req: Request, res: Response, next: NextFunction): void;
/**
 * 404 handler middleware
 * Should be registered after all route handlers
 */
export declare function notFoundHandler(req: Request, res: Response): void;
declare const _default: {
    errorHandler: typeof errorHandler;
    notFoundHandler: typeof notFoundHandler;
};
export default _default;
//# sourceMappingURL=errorHandler.d.ts.map