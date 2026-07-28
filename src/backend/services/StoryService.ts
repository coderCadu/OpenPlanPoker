import { Epic, Story, Task, Session } from '@prisma/client';
import { prisma } from '../config/database';
import { ValidationError, NotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';

const FIBONACCI_CARDS = [1, 2, 3, 5, 8, 13, 21];
const SPECIAL_CARDS = ['?', 'coffee'];
const VALID_CARDS = [...FIBONACCI_CARDS, ...SPECIAL_CARDS];

interface HierarchyNode {
  epics: (Epic & { stories: (Story & { tasks: Task[] })[] })[];
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
export class StoryService {
  /**
   * Create an epic in a session
   */
  async createEpic(sessionId: string, title: string, description?: string): Promise<Epic> {
    try {
      return await prisma.epic.create({
        data: {
          sessionId,
          title,
          description: description || null,
        },
      });
    } catch (error) {
      logger.error({ error: String(error), sessionId, title }, 'Failed to create epic');
      throw error;
    }
  }

  /**
   * Create a story under an epic
   */
  async createStory(sessionId: string, epicId: string, title: string, description?: string): Promise<Story> {
    try {
      return await prisma.story.create({
        data: {
          sessionId,
          epicId,
          title,
          description: description || null,
        },
      });
    } catch (error) {
      logger.error({ error: String(error), sessionId, epicId, title }, 'Failed to create story');
      throw error;
    }
  }

  /**
   * Create a task under a story
   */
  async createTask(sessionId: string, storyId: string, title: string, description?: string): Promise<Task> {
    try {
      return await prisma.task.create({
        data: {
          sessionId,
          storyId,
          title,
          description: description || null,
          status: 'UNESTIMATED',
        },
      });
    } catch (error) {
      logger.error({ error: String(error), sessionId, storyId, title }, 'Failed to create task');
      throw error;
    }
  }

  /**
   * Delete an epic (cascades to stories and tasks)
   */
  async deleteEpic(epicId: string): Promise<void> {
    try {
      await prisma.epic.delete({
        where: { id: epicId },
      });
      logger.info({ epicId }, 'Epic deleted');
    } catch (error) {
      if (error instanceof Error && error.message.includes('Record not found')) {
        throw new NotFoundError(`Epic not found: ${epicId}`);
      }
      logger.error({ error: String(error), epicId }, 'Failed to delete epic');
      throw error;
    }
  }

  /**
   * Delete a story (cascades to tasks)
   */
  async deleteStory(storyId: string): Promise<void> {
    try {
      await prisma.story.delete({
        where: { id: storyId },
      });
      logger.info({ storyId }, 'Story deleted');
    } catch (error) {
      if (error instanceof Error && error.message.includes('Record not found')) {
        throw new NotFoundError(`Story not found: ${storyId}`);
      }
      logger.error({ error: String(error), storyId }, 'Failed to delete story');
      throw error;
    }
  }

  /**
   * Delete a task
   */
  async deleteTask(taskId: string): Promise<void> {
    try {
      await prisma.task.delete({
        where: { id: taskId },
      });
      logger.info({ taskId }, 'Task deleted');
    } catch (error) {
      if (error instanceof Error && error.message.includes('Record not found')) {
        throw new NotFoundError(`Task not found: ${taskId}`);
      }
      logger.error({ error: String(error), taskId }, 'Failed to delete task');
      throw error;
    }
  }

  /**
   * Get full hierarchy for a session
   * @param sessionSlug Session slug (URL-friendly identifier)
   */
  async getSessionHierarchy(sessionSlug: string): Promise<HierarchyNode | null> {
    try {
      const session = await prisma.session.findUnique({
        where: { slug: sessionSlug },
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
    } catch (error) {
      logger.error({ error: String(error), sessionSlug }, 'Failed to get session hierarchy');
      throw error;
    }
  }

  /**
   * Update task estimate
   * Only accepts Fibonacci cards or special cards (?, coffee)
   */
  async updateEstimate(taskId: string, card: number | string): Promise<Task> {
    // Validate card
    if (!VALID_CARDS.includes(card as any)) {
      throw new ValidationError(
        `Invalid card: ${card}. Must be Fibonacci (1,2,3,5,8,13,21), '?', or 'coffee'`,
        'INVALID_CARD'
      );
    }

    try {
      const estimatePoints = typeof card === 'number' ? card : null;
      return await prisma.task.update({
        where: { id: taskId },
        data: {
          estimatePoints,
          status: 'ESTIMATED',
        },
      });
    } catch (error) {
      logger.error({ error: String(error), taskId, card }, 'Failed to update estimate');
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
  async parseMarkdownImport(sessionId: string, markdown: string): Promise<ParseResult> {
    const lines = markdown.split('\n');
    const result: ParseResult = {
      epicsCreated: 0,
      storiesCreated: 0,
      tasksCreated: 0,
    };

    let currentEpicId: string | null = null;
    let currentStoryId: string | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const headingMatch = line.match(/^(#+)\s+(.+)$/);
      if (!headingMatch) continue;

      const level = headingMatch[1].length;
      const title = headingMatch[2].trim();

      try {
        if (level === 1) {
          // Epic level
          const epic = await this.createEpic(sessionId, title);
          currentEpicId = epic.id;
          currentStoryId = null;
          result.epicsCreated++;
        } else if (level === 2) {
          // Story level
          if (!currentEpicId) {
            throw new ValidationError(
              'Story must come after an Epic (# heading)',
              'INVALID_HIERARCHY'
            );
          }
          const story = await this.createStory(sessionId, currentEpicId, title);
          currentStoryId = story.id;
          result.storiesCreated++;
        } else if (level === 3) {
          // Task level
          if (!currentStoryId) {
            throw new ValidationError(
              'Task must come after a Story (## heading)',
              'INVALID_HIERARCHY'
            );
          }
          await this.createTask(sessionId, currentStoryId, title);
          result.tasksCreated++;
        }
      } catch (error) {
        logger.error({ error: String(error), line, sessionId }, 'Error parsing markdown line');
        throw error;
      }
    }

    logger.info(result, 'Markdown import completed');
    return result;
  }
}

export default StoryService;
