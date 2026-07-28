import { Router, Request, Response, NextFunction } from 'express';
import { VoteService } from '../services/VoteService';
import { ValidationError } from '../utils/errors';

const router = Router();

// Create wrappers to allow service injection for testing
class VoteServiceWrapper {
  private service = new VoteService();

  setService(service: VoteService) {
    this.service = service;
  }

  getService(): VoteService {
    return this.service;
  }
}

const serviceWrapper = new VoteServiceWrapper();

function getVoteService(): VoteService {
  return serviceWrapper.getService();
}

export { serviceWrapper };

/**
 * POST /api/tasks/:taskId/vote
 * Record a vote for a task
 */
router.post('/tasks/:taskId/vote', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const taskId = req.params.taskId as string;
    const { participantId, sessionId, card } = req.body || {};

    // Validate input
    if (!participantId) {
      throw new ValidationError('Participant ID is required', 'INVALID_PARTICIPANT_ID');
    }

    if (!sessionId) {
      throw new ValidationError('Session ID is required', 'INVALID_SESSION_ID');
    }

    if (!card) {
      throw new ValidationError('Card is required', 'INVALID_CARD');
    }

    const vote = await getVoteService().recordVote(taskId, participantId, sessionId, card);

    res.status(201).json({
      id: vote.id,
      taskId: vote.taskId,
      participantId: vote.participantId,
      sessionId: vote.sessionId,
      card: vote.card,
      createdAt: vote.createdAt,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/votes/:voteId
 * Update a vote before reveal
 */
router.put('/votes/:voteId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const voteId = req.params.voteId as string;
    const { card } = req.body || {};

    // Validate input
    if (!card) {
      throw new ValidationError('Card is required', 'INVALID_CARD');
    }

    const vote = await getVoteService().updateVote(voteId, card);

    res.json({
      id: vote.id,
      taskId: vote.taskId,
      participantId: vote.participantId,
      sessionId: vote.sessionId,
      card: vote.card,
      updatedAt: vote.updatedAt,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/tasks/:taskId/votes
 * Retrieve all votes for a task (after reveal)
 */
router.get('/tasks/:taskId/votes', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const taskId = req.params.taskId as string;
    const votes = await getVoteService().getAllVotes(taskId);

    res.json(
      votes.map((vote) => ({
        id: vote.id,
        taskId: vote.taskId,
        participantId: vote.participantId,
        sessionId: vote.sessionId,
        card: vote.card,
        createdAt: vote.createdAt,
      }))
    );
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/tasks/:taskId/reveal
 * Reveal votes and calculate statistics (average/median)
 */
router.post('/tasks/:taskId/reveal', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const taskId = req.params.taskId as string;
    const { sessionId } = req.body || {};

    // Validate input
    if (!sessionId) {
      throw new ValidationError('Session ID is required', 'INVALID_SESSION_ID');
    }

    // Get all votes for the task
    const votes = await getVoteService().getAllVotes(taskId);

    // Calculate statistics
    const voteService = getVoteService();
    const average = voteService.calculateAverage(votes);
    const median = voteService.calculateMedian(votes);

    res.json({
      taskId,
      votes: votes.map((vote) => ({
        participantId: vote.participantId,
        card: vote.card,
      })),
      average,
      median,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
