import cron from 'node-cron';
import { SessionService } from '../services/SessionService';
import { InactivityCleanupService } from '../services/InactivityCleanupService';
import { logger } from '../utils/logger';

/**
 * Initialize scheduled jobs for the application
 * - Inactivity cleanup: runs every 5 minutes to archive inactive sessions
 */
export function initializeScheduler(): void {
  const sessionService = new SessionService();
  const cleanupService = new InactivityCleanupService(sessionService);

  // Schedule inactivity cleanup to run every 5 minutes
  // Cron pattern: */5 * * * * (every 5 minutes)
  const cleanupJob = cron.schedule('*/5 * * * *', async () => {
    try {
      await cleanupService.runCleanup();
    } catch (error) {
      logger.error({ error: String(error) }, 'Error in scheduled cleanup job');
    }
  });

  logger.info('Scheduler initialized - inactivity cleanup job scheduled');

  return cleanupJob as any;
}

export default {
  initializeScheduler,
};
