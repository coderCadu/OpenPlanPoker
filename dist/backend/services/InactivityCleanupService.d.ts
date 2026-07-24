import { SessionService } from './SessionService';
/**
 * InactivityCleanupService handles automatic cleanup of inactive sessions
 * Sessions inactive for more than 30 minutes are marked as archived
 */
export declare class InactivityCleanupService {
    private sessionService;
    constructor(sessionService: SessionService);
    /**
     * Run the cleanup job to archive inactive sessions
     * @returns Result object with count of archived sessions
     */
    runCleanup(): Promise<{
        count: number;
    }>;
}
export default InactivityCleanupService;
//# sourceMappingURL=InactivityCleanupService.d.ts.map