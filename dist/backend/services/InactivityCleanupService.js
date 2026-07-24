"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InactivityCleanupService = void 0;
const logger_1 = require("../utils/logger");
/**
 * InactivityCleanupService handles automatic cleanup of inactive sessions
 * Sessions inactive for more than 30 minutes are marked as archived
 */
class InactivityCleanupService {
    constructor(sessionService) {
        this.sessionService = sessionService;
    }
    /**
     * Run the cleanup job to archive inactive sessions
     * @returns Result object with count of archived sessions
     */
    async runCleanup() {
        try {
            logger_1.logger.info('Starting inactivity cleanup job');
            const result = await this.sessionService.expireInactiveSessions();
            logger_1.logger.info({ count: result.count }, 'Inactivity cleanup job completed');
            return result;
        }
        catch (error) {
            logger_1.logger.error({ error: String(error) }, 'Failed to run inactivity cleanup job');
            throw error;
        }
    }
}
exports.InactivityCleanupService = InactivityCleanupService;
exports.default = InactivityCleanupService;
//# sourceMappingURL=InactivityCleanupService.js.map