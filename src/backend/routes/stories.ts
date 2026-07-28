import { Router, Request, Response, NextFunction } from 'express';
import { StoryService } from '../services/StoryService';
import { ValidationError, NotFoundError } from '../utils/errors';
import { validateTitle } from '../utils/validators';
import { logger } from '../utils/logger';

const router = Router();

// Create a wrapper to allow service injection for testing
class StoryServiceWrapper {
  private service = new StoryService();

  setService(service: StoryService) {
    this.service = service;
  }

  getService(): StoryService {
    return this.service;
  }
}

const serviceWrapper = new StoryServiceWrapper();

function getStoryService(): StoryService {
  return serviceWrapper.getService();
}

export { serviceWrapper };

/**
 * POST /api/epics
 * Create a new epic
 */
router.post('/epics', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId, title, description } = req.body || {};

    // Validate input
    if (!sessionId) {
      throw new ValidationError('Session ID is required', 'INVALID_SESSION_ID');
    }

    if (!title || !validateTitle(title)) {
      throw new ValidationError('Title is required and must be 1-255 characters', 'INVALID_TITLE');
    }

    const epic = await getStoryService().createEpic(sessionId, title, description || undefined);

    res.status(201).json({
      id: epic.id,
      sessionId: epic.sessionId,
      title: epic.title,
      description: epic.description,
      createdAt: epic.createdAt,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/epics/:epicId
 * Delete an epic (cascades to stories and tasks)
 */
router.delete('/epics/:epicId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const epicId = req.params.epicId as string;
    await getStoryService().deleteEpic(epicId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/epics/:epicId/stories
 * Create a story within an epic
 */
router.post('/epics/:epicId/stories', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const epicId = req.params.epicId as string;
    const { sessionId, title, description } = req.body || {};

    // Validate input
    if (!sessionId) {
      throw new ValidationError('Session ID is required', 'INVALID_SESSION_ID');
    }

    if (!title || !validateTitle(title)) {
      throw new ValidationError('Title is required and must be 1-255 characters', 'INVALID_TITLE');
    }

    const story = await getStoryService().createStory(sessionId, epicId, title, description || undefined);

    res.status(201).json({
      id: story.id,
      epicId: story.epicId,
      title: story.title,
      description: story.description,
      createdAt: story.createdAt,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/stories/:storyId
 * Delete a story (cascades to tasks)
 */
router.delete('/stories/:storyId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const storyId = req.params.storyId as string;
    await getStoryService().deleteStory(storyId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/stories/:storyId/tasks
 * Create a task within a story
 */
router.post('/stories/:storyId/tasks', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const storyId = req.params.storyId as string;
    const { sessionId, title, description } = req.body || {};

    // Validate input
    if (!sessionId) {
      throw new ValidationError('Session ID is required', 'INVALID_SESSION_ID');
    }

    if (!title || !validateTitle(title)) {
      throw new ValidationError('Title is required and must be 1-255 characters', 'INVALID_TITLE');
    }

    const task = await getStoryService().createTask(sessionId, storyId, title, description || undefined);

    res.status(201).json({
      id: task.id,
      storyId: task.storyId,
      title: task.title,
      description: task.description,
      estimatePoints: task.estimatePoints,
      createdAt: task.createdAt,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/tasks/:taskId
 * Delete a task
 */
router.delete('/tasks/:taskId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const taskId = req.params.taskId as string;
    await getStoryService().deleteTask(taskId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/tasks/:taskId/estimate
 * Confirm the final estimate for a task after votes are revealed
 */
router.put('/tasks/:taskId/estimate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const taskId = req.params.taskId as string;
    const { card } = req.body || {};

    if (card === undefined || card === null || card === '') {
      throw new ValidationError('Card is required', 'INVALID_CARD');
    }

    const task = await getStoryService().updateEstimate(taskId, card);

    res.json({
      id: task.id,
      storyId: task.storyId,
      title: task.title,
      estimatePoints: task.estimatePoints,
      status: task.status,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/sessions/:sessionSlug/hierarchy
 * Retrieve full session hierarchy (epics → stories → tasks)
 */
router.get('/sessions/:sessionSlug/hierarchy', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionSlug = req.params.sessionSlug as string;

    const hierarchy = await getStoryService().getSessionHierarchy(sessionSlug);

    if (!hierarchy) {
      throw new NotFoundError(
        `Session with slug "${sessionSlug}" not found`,
        'SESSION_NOT_FOUND'
      );
    }

    res.json(hierarchy);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/sessions/:sessionSlug/import-markdown
 * Import markdown and create hierarchy
 */
router.post(
  '/sessions/:sessionSlug/import-markdown',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sessionSlug = req.params.sessionSlug as string;
      const { markdown } = req.body || {};

      // Validate input
      if (!markdown || markdown.trim().length === 0) {
        throw new ValidationError('Markdown content is required', 'INVALID_MARKDOWN');
      }

      const result = await getStoryService().parseMarkdownImport(sessionSlug, markdown);

      res.status(201).json({
        epicsCreated: result.epicsCreated,
        storiesCreated: result.storiesCreated,
        tasksCreated: result.tasksCreated,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
