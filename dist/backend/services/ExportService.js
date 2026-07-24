"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportService = void 0;
const database_1 = require("../config/database");
const markdown_1 = require("../utils/markdown");
const logger_1 = require("../utils/logger");
/**
 * ExportService generates markdown exports from session data
 */
class ExportService {
    /**
     * Generate markdown from session hierarchy and estimates
     */
    async generateMarkdown(sessionId) {
        try {
            const session = await database_1.prisma.session.findUnique({
                where: { id: sessionId },
                include: {
                    participants: true,
                    epics: {
                        include: {
                            stories: {
                                include: {
                                    tasks: true,
                                },
                                orderBy: { createdAt: 'asc' },
                            },
                        },
                        orderBy: { createdAt: 'asc' },
                    },
                },
            });
            if (!session) {
                throw new Error(`Session not found: ${sessionId}`);
            }
            let markdown = '';
            // Session metadata
            markdown += `# Planning Poker Session: ${(0, markdown_1.escapeMarkdown)(session.name)}\n\n`;
            markdown += `**Session ID:** ${session.slug}\n`;
            markdown += `**Date:** ${session.createdAt.toISOString().split('T')[0]}\n`;
            markdown += `**Participants:** ${session.participants.map((p) => p.pseudonym).join(', ')}\n`;
            markdown += `**Duration:** ${this.calculateDuration(session.createdAt, session.updatedAt)}\n\n`;
            // Hierarchy
            for (const epic of session.epics) {
                markdown += this.formatEpic(epic);
            }
            logger_1.logger.info({ sessionId, length: markdown.length }, 'Markdown exported');
            return markdown;
        }
        catch (error) {
            logger_1.logger.error({ error: String(error), sessionId }, 'Failed to generate markdown');
            throw error;
        }
    }
    /**
     * Format epic with nested stories and tasks
     */
    formatEpic(epic) {
        let markdown = `## ${(0, markdown_1.escapeMarkdown)(epic.title)}`;
        if (epic.estimatePoints) {
            markdown += ` (est: ${epic.estimatePoints})`;
        }
        else {
            markdown += ` (no estimate)`;
        }
        markdown += '\n\n';
        if (epic.description) {
            markdown += `${epic.description}\n\n`;
        }
        for (const story of epic.stories) {
            markdown += this.formatStory(story);
        }
        return markdown;
    }
    /**
     * Format story with nested tasks
     */
    formatStory(story) {
        let markdown = `### ${(0, markdown_1.escapeMarkdown)(story.title)}`;
        if (story.estimatePoints) {
            markdown += ` (est: ${story.estimatePoints})`;
        }
        else {
            markdown += ` (no estimate)`;
        }
        markdown += '\n\n';
        if (story.description) {
            markdown += `${story.description}\n\n`;
        }
        for (const task of story.tasks) {
            markdown += this.formatTask(task);
        }
        return markdown;
    }
    /**
     * Format task
     */
    formatTask(task) {
        let markdown = `- **${(0, markdown_1.escapeMarkdown)(task.title)}**`;
        if (task.estimatePoints) {
            markdown += ` (est: ${task.estimatePoints})`;
        }
        else {
            markdown += ` (no estimate)`;
        }
        markdown += '\n';
        if (task.description) {
            markdown += `  ${task.description}\n`;
        }
        return markdown;
    }
    /**
     * Calculate session duration in minutes
     */
    calculateDuration(createdAt, updatedAt) {
        const ms = updatedAt.getTime() - createdAt.getTime();
        const minutes = Math.floor(ms / (1000 * 60));
        const hours = Math.floor(minutes / 60);
        if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        }
        return `${minutes}m`;
    }
}
exports.ExportService = ExportService;
exports.default = ExportService;
//# sourceMappingURL=ExportService.js.map