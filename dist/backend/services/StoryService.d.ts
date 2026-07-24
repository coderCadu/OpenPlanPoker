import { Epic, Story, Task } from '@prisma/client';
interface HierarchyNode {
    epics: (Epic & {
        stories: (Story & {
            tasks: Task[];
        })[];
    })[];
}
interface ParseResult {
    epicsCreated: number;
    storiesCreated: number;
    tasksCreated: number;
}
/**
 * StoryService handles story, epic, and task management
 * Manages the epic→story→task hierarchy
 */
export declare class StoryService {
    /**
     * Create an epic in a session
     */
    createEpic(sessionId: string, title: string, description?: string): Promise<Epic>;
    /**
     * Create a story under an epic
     */
    createStory(sessionId: string, epicId: string, title: string, description?: string): Promise<Story>;
    /**
     * Create a task under a story
     */
    createTask(sessionId: string, storyId: string, title: string, description?: string): Promise<Task>;
    /**
     * Delete an epic (cascades to stories and tasks)
     */
    deleteEpic(epicId: string): Promise<void>;
    /**
     * Delete a story (cascades to tasks)
     */
    deleteStory(storyId: string): Promise<void>;
    /**
     * Delete a task
     */
    deleteTask(taskId: string): Promise<void>;
    /**
     * Get full hierarchy for a session
     */
    getSessionHierarchy(sessionId: string): Promise<HierarchyNode | null>;
    /**
     * Update task estimate
     * Only accepts Fibonacci cards or special cards (?, coffee)
     */
    updateEstimate(taskId: string, card: number | string): Promise<Task>;
    /**
     * Parse markdown import and create hierarchy
     * Format:
     * # Epic Title
     * ## Story Title
     * ### Task Title
     */
    parseMarkdownImport(sessionId: string, markdown: string): Promise<ParseResult>;
}
export default StoryService;
//# sourceMappingURL=StoryService.d.ts.map