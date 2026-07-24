"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createChildLogger = exports.logger = void 0;
const pino_1 = __importDefault(require("pino"));
/**
 * Create and configure Pino logger instance
 * - Logs to stdout in development with pretty formatting
 * - JSON logs in production for structured logging
 * - All logs include timestamps
 */
function createLogger() {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const logger = (0, pino_1.default)({
        level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
        timestamp: pino_1.default.stdTimeFunctions.isoTime,
    }, 
    // Transport for pretty printing in development
    isDevelopment
        ? pino_1.default.transport({
            target: 'pino-pretty',
            options: {
                colorize: true,
                singleLine: false,
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
            },
        })
        : undefined);
    return logger;
}
/**
 * Global logger instance
 * Use this throughout the application for consistent logging
 */
exports.logger = createLogger();
/**
 * Create a child logger with additional context
 * @param context Additional properties to include in all logs
 * @returns Child logger instance
 */
function createChildLogger(context) {
    return exports.logger.child(context);
}
exports.createChildLogger = createChildLogger;
exports.default = {
    logger: exports.logger,
    createChildLogger,
};
//# sourceMappingURL=logger.js.map