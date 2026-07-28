import { Router, Request, Response, NextFunction } from 'express';
import { SessionService } from '../services/SessionService';
import { ValidationError, NotFoundError, ConflictError, ForbiddenError } from '../utils/errors';
import { validateTitle, validatePseudonym } from '../utils/validators';
import { logger } from '../utils/logger';

const router = Router();

// Create a wrapper to allow service injection for testing
class SessionServiceWrapper {
  private service = new SessionService();

  setService(service: SessionService) {
    this.service = service;
  }

  getService(): SessionService {
    return this.service;
  }
}

const serviceWrapper = new SessionServiceWrapper();

function getSessionService(): SessionService {
  return serviceWrapper.getService();
}

export { serviceWrapper };

/**
 * POST /api/sessions
 * Create a new planning poker session
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, moderatorId, description } = req.body || {};

    // Validate input
    if (!name || !validateTitle(name)) {
      throw new ValidationError('Session name is required and must be 1-255 characters', 'INVALID_NAME');
    }

    if (!moderatorId || !validatePseudonym(moderatorId)) {
      throw new ValidationError('Moderator ID is required and must be 1-50 characters', 'INVALID_MODERATOR_ID');
    }

    const session = await getSessionService().createSession(name, moderatorId, description);

    res.status(201).json({
      id: session.id,
      slug: session.slug,
      name: session.name,
      moderatorId: session.moderatorId,
      description: session.description,
      status: session.status,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/sessions/:slug
 * Retrieve a session by slug
 */
router.get('/:slug', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const slug = req.params.slug as string;

    const session = await getSessionService().getSessionBySlug(slug);

    if (!session) {
      throw new NotFoundError(`Session with slug "${slug}" not found`, 'SESSION_NOT_FOUND');
    }

    const participants = await getSessionService().getParticipants(session.id);

    res.json({
      id: session.id,
      slug: session.slug,
      name: session.name,
      moderatorId: session.moderatorId,
      description: session.description,
      status: session.status,
      createdAt: session.createdAt,
      lastActivityAt: session.lastActivityAt,
      participants: participants.map((p) => ({
        id: p.id,
        pseudonym: p.pseudonym,
        joinedAt: p.joinedAt,
      })),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/sessions/:slug/join
 * Add a participant to a session
 */
router.post('/:slug/join', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const slug = req.params.slug as string;
    const { pseudonym } = req.body || {};

    // Validate input
    if (!pseudonym || !validatePseudonym(pseudonym)) {
      throw new ValidationError('Pseudonym is required and must be 1-50 characters', 'INVALID_PSEUDONYM');
    }

    // Find session
    const session = await getSessionService().getSessionBySlug(slug);
    if (!session) {
      throw new NotFoundError(`Session with slug "${slug}" not found`, 'SESSION_NOT_FOUND');
    }

    // Join session
    const participant = await getSessionService().joinSession(session.id, pseudonym);

    res.status(201).json({
      id: participant.id,
      sessionId: participant.sessionId,
      pseudonym: participant.pseudonym,
      joinedAt: participant.joinedAt,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/sessions/:slug/leave
 * Remove a participant from a session
 */
router.post('/:slug/leave', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const slug = req.params.slug as string;
    const { pseudonym } = req.body || {};

    // Validate input
    if (!pseudonym || !validatePseudonym(pseudonym)) {
      throw new ValidationError('Pseudonym is required and must be 1-50 characters', 'INVALID_PSEUDONYM');
    }

    // Find session
    const session = await getSessionService().getSessionBySlug(slug);
    if (!session) {
      throw new NotFoundError(`Session with slug "${slug}" not found`, 'SESSION_NOT_FOUND');
    }

    // Leave session
    const participant = await getSessionService().leaveSession(session.id, pseudonym);

    res.json({
      id: participant.id,
      sessionId: participant.sessionId,
      pseudonym: participant.pseudonym,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/sessions/:slug/close
 * Close a session
 */
router.post('/:slug/close', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const slug = req.params.slug as string;
    const { moderatorId } = req.body || {};

    // Find session
    const session = await getSessionService().getSessionBySlug(slug);
    if (!session) {
      throw new NotFoundError(`Session with slug "${slug}" not found`, 'SESSION_NOT_FOUND');
    }

    // Verify moderator (only moderator can close)
    if (session.moderatorId !== moderatorId) {
      throw new ForbiddenError('Only the session moderator can close the session', 'UNAUTHORIZED_MODERATOR');
    }

    // Close session
    await getSessionService().closeSession(session.id);

    res.json({
      id: session.id,
      slug: session.slug,
      status: 'CLOSED',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
