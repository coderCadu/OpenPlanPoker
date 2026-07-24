/**
 * ExportService generates markdown exports from session data
 */
export declare class ExportService {
    /**
     * Generate markdown from session hierarchy and estimates
     */
    generateMarkdown(sessionId: string): Promise<string>;
    /**
     * Format epic with nested stories and tasks
     */
    private formatEpic;
    /**
     * Format story with nested tasks
     */
    private formatStory;
    /**
     * Format task
     */
    private formatTask;
    /**
     * Calculate session duration in minutes
     */
    private calculateDuration;
}
export default ExportService;
//# sourceMappingURL=ExportService.d.ts.map