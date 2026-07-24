"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serviceWrapper = void 0;
const express_1 = require("express");
const SessionService_1 = require("../services/SessionService");
const errors_1 = require("../utils/errors");
const validators_1 = require("../utils/validators");
const router = (0, express_1.Router)();
// Create a wrapper to allow service injection for testing
class SessionServiceWrapper {
    constructor() {
        this.service = new SessionService_1.SessionService();
    }
    setService(service) {
        this.service = service;
    }
    getService() {
        return this.service;
    }
}
const serviceWrapper = new SessionServiceWrapper();
exports.serviceWrapper = serviceWrapper;
function getSessionService() {
    return serviceWrapper.getService();
}
/**
 * POST /api/sessions
 * Create a new planning poker session
 */
router.post('/', async (req, res, next) => {
    try {
        const { name, moderatorId, description } = req.body;
        // Validate input
        if (!name || !(0, validators_1.validateTitle)(name)) {
            throw new errors_1.ValidationError('Session name is required and must be 1-255 characters', 'INVALID_NAME');
        }
        if (!moderatorId || !(0, validators_1.validatePseudonym)(moderatorId)) {
            throw new errors_1.ValidationError('Moderator ID is required and must be 1-50 characters', 'INVALID_MODERATOR_ID');
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
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/sessions/:slug
 * Retrieve a session by slug
 */
router.get('/:slug', async (req, res, next) => {
    try {
        const slug = req.params.slug;
        const session = await getSessionService().getSessionBySlug(slug);
        if (!session) {
            throw new errors_1.NotFoundError(`Session with slug "${slug}" not found`, 'SESSION_NOT_FOUND');
        }
        res.json({
            id: session.id,
            slug: session.slug,
            name: session.name,
            moderatorId: session.moderatorId,
            description: session.description,
            status: session.status,
            createdAt: session.createdAt,
            lastActivityAt: session.lastActivityAt,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/sessions/:slug/join
 * Add a participant to a session
 */
router.post('/:slug/join', async (req, res, next) => {
    try {
        const slug = req.params.slug;
        const { pseudonym } = req.body;
        // Validate input
        if (!pseudonym || !(0, validators_1.validatePseudonym)(pseudonym)) {
            throw new errors_1.ValidationError('Pseudonym is required and must be 1-50 characters', 'INVALID_PSEUDONYM');
        }
        // Find session
        const session = await getSessionService().getSessionBySlug(slug);
        if (!session) {
            throw new errors_1.NotFoundError(`Session with slug "${slug}" not found`, 'SESSION_NOT_FOUND');
        }
        // Join session
        const participant = await getSessionService().joinSession(session.id, pseudonym);
        res.status(201).json({
            id: participant.id,
            sessionId: participant.sessionId,
            pseudonym: participant.pseudonym,
            joinedAt: participant.joinedAt,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/sessions/:slug/leave
 * Remove a participant from a session
 */
router.post('/:slug/leave', async (req, res, next) => {
    try {
        const slug = req.params.slug;
        const { pseudonym } = req.body;
        // Validate input
        if (!pseudonym || !(0, validators_1.validatePseudonym)(pseudonym)) {
            throw new errors_1.ValidationError('Pseudonym is required and must be 1-50 characters', 'INVALID_PSEUDONYM');
        }
        // Find session
        const session = await getSessionService().getSessionBySlug(slug);
        if (!session) {
            throw new errors_1.NotFoundError(`Session with slug "${slug}" not found`, 'SESSION_NOT_FOUND');
        }
        // Leave session
        const participant = await getSessionService().leaveSession(session.id, pseudonym);
        res.json({
            id: participant.id,
            sessionId: participant.sessionId,
            pseudonym: participant.pseudonym,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/sessions/:slug/close
 * Close a session
 */
router.post('/:slug/close', async (req, res, next) => {
    try {
        const slug = req.params.slug;
        const { moderatorId } = req.body;
        // Find session
        const session = await getSessionService().getSessionBySlug(slug);
        if (!session) {
            throw new errors_1.NotFoundError(`Session with slug "${slug}" not found`, 'SESSION_NOT_FOUND');
        }
        // Verify moderator (only moderator can close)
        if (session.moderatorId !== moderatorId) {
            throw new errors_1.ForbiddenError('Only the session moderator can close the session', 'UNAUTHORIZED_MODERATOR');
        }
        // Close session
        await getSessionService().closeSession(session.id);
        res.json({
            id: session.id,
            slug: session.slug,
            status: 'CLOSED',
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=sessions.js.map