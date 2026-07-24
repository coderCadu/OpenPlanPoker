import pino from 'pino';

/**
 * Create and configure Pino logger instance
 * - Logs to stdout in development with pretty formatting
 * - JSON logs in production for structured logging
 * - All logs include timestamps
 */
function createLogger() {
  const isDevelopment = process.env.NODE_ENV === 'development';

  const logger = pino(
    {
      level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
      timestamp: pino.stdTimeFunctions.isoTime,
    },
    // Transport for pretty printing in development
    isDevelopment
      ? pino.transport({
          target: 'pino-pretty',
          options: {
            colorize: true,
            singleLine: false,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          },
        })
      : undefined
  );

  return logger;
}

/**
 * Global logger instance
 * Use this throughout the application for consistent logging
 */
export const logger = createLogger();

/**
 * Create a child logger with additional context
 * @param context Additional properties to include in all logs
 * @returns Child logger instance
 */
export function createChildLogger(context: Record<string, any>) {
  return logger.child(context);
}

export default {
  logger,
  createChildLogger,
};
