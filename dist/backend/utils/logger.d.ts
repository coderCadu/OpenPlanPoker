import pino from 'pino';
/**
 * Global logger instance
 * Use this throughout the application for consistent logging
 */
export declare const logger: pino.Logger<never, boolean>;
/**
 * Create a child logger with additional context
 * @param context Additional properties to include in all logs
 * @returns Child logger instance
 */
export declare function createChildLogger(context: Record<string, any>): pino.Logger<never, boolean>;
declare const _default: {
    logger: pino.Logger<never, boolean>;
    createChildLogger: typeof createChildLogger;
};
export default _default;
//# sourceMappingURL=logger.d.ts.map