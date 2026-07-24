"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoryService = void 0;
const database_1 = require("../config/database");
const errors_1 = require("../utils/errors");
const logger_1 = require("../utils/logger");
const FIBONACCI_CARDS = [1, 2, 3, 5, 8, 13, 21];
const SPECIAL_CARDS = ['?', 'coffee'];
const VALID_CARDS = [...FIBONACCI_CARDS, ...SPECIAL_CARDS];
/**
 * StoryService handles story, epic, and task management
 * Manages the epic→story→task hierarchy
 */
class StoryService {
    /**
     * Create an epic in a session
     */
    async createEpic(sessionId, title, description) {
        try {
            return await database_1.prisma.epic.create({
                data: {
                    sessionId,
                    title,
                    description: description || null,
                },
            });
        }
        catch (error) {
            logger_1.logger.error({ error: String(error), sessionId, title }, 'Failed to create epic');
            throw error;
        }
    }
    /**
     * Create a story under an epic
     */
    async createStory(sessionId, epicId, title, description) {
        try {
            return await database_1.prisma.story.create({
                data: {
                    sessionId,
                    epicId,
                    title,
                    description: description || null,
                },
            });
        }
        catch (error) {
            logger_1.logger.error({ error: String(error), sessionId, epicId, title }, 'Failed to create story');
            throw error;
        }
    }
    /**
     * Create a task under a story
     */
    async createTask(sessionId, storyId, title, description) {
        try {
            return await database_1.prisma.task.create({
                data: {
                    sessionId,
                    storyId,
                    title,
                    description: description || null,
                    status: 'UNESTIMATED',
                },
            });
        }
        catch (error) {
            logger_1.logger.error({ error: String(error), sessionId, storyId, title }, 'Failed to create task');
            throw error;
        }
    }
    /**
     * Delete an epic (cascades to stories and tasks)
     */
    async deleteEpic(epicId) {
        try {
            await database_1.prisma.epic.delete({
                where: { id: epicId },
            });
            logger_1.logger.info({ epicId }, 'Epic deleted');
        }
        catch (error) {
            if (error instanceof Error && error.message.includes('Record not found')) {
                throw new errors_1.NotFoundError(`Epic not found: ${epicId}`);
            }
            logger_1.logger.error({ error: String(error), epicId }, 'Failed to delete epic');
            throw error;
        }
    }
    /**
     * Delete a story (cascades to tasks)
     */
    async deleteStory(storyId) {
        try {
            await database_1.prisma.story.delete({
                where: { id: storyId },
            });
            logger_1.logger.info({ storyId }, 'Story deleted');
        }
        catch (error) {
            if (error instanceof Error && error.message.includes('Record not found')) {
                throw new errors_1.NotFoundError(`Story not found: ${storyId}`);
            }
            logger_1.logger.error({ error: String(error), storyId }, 'Failed to delete story');
            throw error;
        }
    }
    /**
     * Delete a task
     */
    async deleteTask(taskId) {
        try {
            await database_1.prisma.task.delete({
                where: { id: taskId },
            });
            logger_1.logger.info({ taskId }, 'Task deleted');
        }
        catch (error) {
            if (error instanceof Error && error.message.includes('Record not found')) {
                throw new errors_1.NotFoundError(`Task not found: ${taskId}`);
            }
            logger_1.logger.error({ error: String(error), taskId }, 'Failed to delete task');
            throw error;
        }
    }
    /**
     * Get full hierarchy for a session
     */
    async getSessionHierarchy(sessionId) {
        try {
            const session = await database_1.prisma.session.findUnique({
                where: { id: sessionId },
                include: {
                    epics: {
                        include: {
                            stories: {
                                include: {
                                    tasks: {
                                        orderBy: { createdAt: 'asc' },
                                    },
                                },
                                orderBy: { createdAt: 'asc' },
                            },
                        },
                        orderBy: { createdAt: 'asc' },
                    },
                },
            });
            if (!session) {
                return null;
            }
            return { epics: session.epics };
        }
        catch (error) {
            logger_1.logger.error({ error: String(error), sessionId }, 'Failed to get session hierarchy');
            throw error;
        }
    }
    /**
     * Update task estimate
     * Only accepts Fibonacci cards or special cards (?, coffee)
     */
    async updateEstimate(taskId, card) {
        // Validate card
        if (!VALID_CARDS.includes(card)) {
            throw new errors_1.ValidationError(`Invalid card: ${card}. Must be Fibonacci (1,2,3,5,8,13,21), '?', or 'coffee'`, 'INVALID_CARD');
        }
        try {
            const estimatePoints = typeof card === 'number' ? card : null;
            return await database_1.prisma.task.update({
                where: { id: taskId },
                data: {
                    estimatePoints,
                    status: 'ESTIMATED',
                },
            });
        }
        catch (error) {
            logger_1.logger.error({ error: String(error), taskId, card }, 'Failed to update estimate');
            throw error;
        }
    }
    /**
     * Parse markdown import and create hierarchy
     * Format:
     * # Epic Title
     * ## Story Title
     * ### Task Title
     */
    async parseMarkdownImport(sessionId, markdown) {
        const lines = markdown.split('\n');
        const result = {
            epicsCreated: 0,
            storiesCreated: 0,
            tasksCreated: 0,
        };
        let currentEpicId = null;
        let currentStoryId = null;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line)
                continue;
            const headingMatch = line.match(/^(#+)\s+(.+)$/);
            if (!headingMatch)
                continue;
            const level = headingMatch[1].length;
            const title = headingMatch[2].trim();
            try {
                if (level === 1) {
                    // Epic level
                    const epic = await this.createEpic(sessionId, title);
                    currentEpicId = epic.id;
                    currentStoryId = null;
                    result.epicsCreated++;
                }
                else if (level === 2) {
                    // Story level
                    if (!currentEpicId) {
                        throw new errors_1.ValidationError('Story must come after an Epic (# heading)', 'INVALID_HIERARCHY');
                    }
                    const story = await this.createStory(sessionId, currentEpicId, title);
                    currentStoryId = story.id;
                    result.storiesCreated++;
                }
                else if (level === 3) {
                    // Task level
                    if (!currentStoryId) {
                        throw new errors_1.ValidationError('Task must come after a Story (## heading)', 'INVALID_HIERARCHY');
                    }
                    await this.createTask(sessionId, currentStoryId, title);
                    result.tasksCreated++;
                }
            }
            catch (error) {
                logger_1.logger.error({ error: String(error), line, sessionId }, 'Error parsing markdown line');
                throw error;
            }
        }
        logger_1.logger.info(result, 'Markdown import completed');
        return result;
    }
}
exports.StoryService = StoryService;
exports.default = StoryService;
//# sourceMappingURL=StoryService.js.map