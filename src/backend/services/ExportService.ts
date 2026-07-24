import { prisma } from '../config/database';
import { escapeMarkdown } from '../utils/markdown';
import { logger } from '../utils/logger';

/**
 * ExportService generates markdown exports from session data
 */
export class ExportService {
  /**
   * Generate markdown from session hierarchy and estimates
   */
  async generateMarkdown(sessionId: string): Promise<string> {
    try {
      const session = await prisma.session.findUnique({
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
      markdown += `# Planning Poker Session: ${escapeMarkdown(session.name)}\n\n`;
      markdown += `**Session ID:** ${session.slug}\n`;
      markdown += `**Date:** ${session.createdAt.toISOString().split('T')[0]}\n`;
      markdown += `**Participants:** ${session.participants.map((p) => p.pseudonym).join(', ')}\n`;
      markdown += `**Duration:** ${this.calculateDuration(session.createdAt, session.updatedAt)}\n\n`;

      // Hierarchy
      for (const epic of session.epics) {
        markdown += this.formatEpic(epic);
      }

      logger.info({ sessionId, length: markdown.length }, 'Markdown exported');
      return markdown;
    } catch (error) {
      logger.error({ error: String(error), sessionId }, 'Failed to generate markdown');
      throw error;
    }
  }

  /**
   * Format epic with nested stories and tasks
   */
  private formatEpic(epic: any): string {
    let markdown = `## ${escapeMarkdown(epic.title)}`;

    if (epic.estimatePoints) {
      markdown += ` (est: ${epic.estimatePoints})`;
    } else {
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
  private formatStory(story: any): string {
    let markdown = `### ${escapeMarkdown(story.title)}`;

    if (story.estimatePoints) {
      markdown += ` (est: ${story.estimatePoints})`;
    } else {
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
  private formatTask(task: any): string {
    let markdown = `- **${escapeMarkdown(task.title)}**`;

    if (task.estimatePoints) {
      markdown += ` (est: ${task.estimatePoints})`;
    } else {
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
  private calculateDuration(createdAt: Date, updatedAt: Date): string {
    const ms = updatedAt.getTime() - createdAt.getTime();
    const minutes = Math.floor(ms / (1000 * 60));
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  }
}

export default ExportService;
