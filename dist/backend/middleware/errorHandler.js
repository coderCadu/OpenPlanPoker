"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = exports.errorHandler = void 0;
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
/**
 * Express error handler middleware
 * Catches all errors thrown in route handlers and returns consistent JSON responses
 *
 * Usage: Register as the last middleware in your Express app
 * app.use(errorHandler);
 */
function errorHandler(error, req, res, next) {
    // Determine status code and error details
    let status = 500;
    let errorName = 'Error';
    let message = 'An unexpected error occurred';
    if (error instanceof Error) {
        errorName = error.name;
        message = error.message || message;
    }
    if ((0, errors_1.isAppError)(error)) {
        status = error.status;
    }
    // Log the error
    logger_1.logger.error({
        message: error instanceof Error ? error.message : String(error),
        error: errorName,
        status,
        method: req.method,
        path: req.path,
        requestId: req.id,
        timestamp: new Date().toISOString(),
    });
    // Build response
    const response = {
        error: errorName,
        message,
        status,
    };
    // Include request ID if available
    if (req.id) {
        response.requestId = req.id;
    }
    // Send response
    res.status(status).json(response);
}
exports.errorHandler = errorHandler;
/**
 * 404 handler middleware
 * Should be registered after all route handlers
 */
function notFoundHandler(req, res) {
    const error = new errors_1.AppError(`Route not found: ${req.method} ${req.path}`, 404, 'NOT_FOUND');
    errorHandler(error, req, res, () => { });
}
exports.notFoundHandler = notFoundHandler;
exports.default = {
    errorHandler,
    notFoundHandler,
};
//# sourceMappingURL=errorHandler.js.map