"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeScheduler = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const SessionService_1 = require("../services/SessionService");
const InactivityCleanupService_1 = require("../services/InactivityCleanupService");
const logger_1 = require("../utils/logger");
/**
 * Initialize scheduled jobs for the application
 * - Inactivity cleanup: runs every 5 minutes to archive inactive sessions
 */
function initializeScheduler() {
    const sessionService = new SessionService_1.SessionService();
    const cleanupService = new InactivityCleanupService_1.InactivityCleanupService(sessionService);
    // Schedule inactivity cleanup to run every 5 minutes
    // Cron pattern: */5 * * * * (every 5 minutes)
    const cleanupJob = node_cron_1.default.schedule('*/5 * * * *', async () => {
        try {
            await cleanupService.runCleanup();
        }
        catch (error) {
            logger_1.logger.error({ error: String(error) }, 'Error in scheduled cleanup job');
        }
    });
    logger_1.logger.info('Scheduler initialized - inactivity cleanup job scheduled');
    return cleanupJob;
}
exports.initializeScheduler = initializeScheduler;
exports.default = {
    initializeScheduler,
};
//# sourceMappingURL=index.js.map