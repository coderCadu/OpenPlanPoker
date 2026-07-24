import { SessionService } from './SessionService';
import { logger } from '../utils/logger';

/**
 * InactivityCleanupService handles automatic cleanup of inactive sessions
 * Sessions inactive for more than 30 minutes are marked as archived
 */
export class InactivityCleanupService {
  private sessionService: SessionService;

  constructor(sessionService: SessionService) {
    this.sessionService = sessionService;
  }

  /**
   * Run the cleanup job to archive inactive sessions
   * @returns Result object with count of archived sessions
   */
  async runCleanup(): Promise<{ count: number }> {
    try {
      logger.info('Starting inactivity cleanup job');

      const result = await this.sessionService.expireInactiveSessions();

      logger.info({ count: result.count }, 'Inactivity cleanup job completed');

      return result;
    } catch (error) {
      logger.error({ error: String(error) }, 'Failed to run inactivity cleanup job');
      throw error;
    }
  }
}

export default InactivityCleanupService;
