"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serviceWrapper = void 0;
const express_1 = require("express");
const StoryService_1 = require("../services/StoryService");
const errors_1 = require("../utils/errors");
const validators_1 = require("../utils/validators");
const router = (0, express_1.Router)();
// Create a wrapper to allow service injection for testing
class StoryServiceWrapper {
    constructor() {
        this.service = new StoryService_1.StoryService();
    }
    setService(service) {
        this.service = service;
    }
    getService() {
        return this.service;
    }
}
const serviceWrapper = new StoryServiceWrapper();
exports.serviceWrapper = serviceWrapper;
function getStoryService() {
    return serviceWrapper.getService();
}
/**
 * POST /api/epics
 * Create a new epic
 */
router.post('/epics', async (req, res, next) => {
    try {
        const { sessionId, title, description } = req.body;
        // Validate input
        if (!sessionId) {
            throw new errors_1.ValidationError('Session ID is required', 'INVALID_SESSION_ID');
        }
        if (!title || !(0, validators_1.validateTitle)(title)) {
            throw new errors_1.ValidationError('Title is required and must be 1-255 characters', 'INVALID_TITLE');
        }
        const epic = await getStoryService().createEpic(sessionId, title, description || undefined);
        res.status(201).json({
            id: epic.id,
            sessionId: epic.sessionId,
            title: epic.title,
            description: epic.description,
            createdAt: epic.createdAt,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * DELETE /api/epics/:epicId
 * Delete an epic (cascades to stories and tasks)
 */
router.delete('/epics/:epicId', async (req, res, next) => {
    try {
        const epicId = req.params.epicId;
        await getStoryService().deleteEpic(epicId);
        res.status(204).send();
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/epics/:epicId/stories
 * Create a story within an epic
 */
router.post('/epics/:epicId/stories', async (req, res, next) => {
    try {
        const epicId = req.params.epicId;
        const { sessionId, title, description } = req.body;
        // Validate input
        if (!sessionId) {
            throw new errors_1.ValidationError('Session ID is required', 'INVALID_SESSION_ID');
        }
        if (!title || !(0, validators_1.validateTitle)(title)) {
            throw new errors_1.ValidationError('Title is required and must be 1-255 characters', 'INVALID_TITLE');
        }
        const story = await getStoryService().createStory(sessionId, epicId, title, description || undefined);
        res.status(201).json({
            id: story.id,
            epicId: story.epicId,
            title: story.title,
            description: story.description,
            createdAt: story.createdAt,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * DELETE /api/stories/:storyId
 * Delete a story (cascades to tasks)
 */
router.delete('/stories/:storyId', async (req, res, next) => {
    try {
        const storyId = req.params.storyId;
        await getStoryService().deleteStory(storyId);
        res.status(204).send();
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/stories/:storyId/tasks
 * Create a task within a story
 */
router.post('/stories/:storyId/tasks', async (req, res, next) => {
    try {
        const storyId = req.params.storyId;
        const { sessionId, title, description } = req.body;
        // Validate input
        if (!sessionId) {
            throw new errors_1.ValidationError('Session ID is required', 'INVALID_SESSION_ID');
        }
        if (!title || !(0, validators_1.validateTitle)(title)) {
            throw new errors_1.ValidationError('Title is required and must be 1-255 characters', 'INVALID_TITLE');
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
    }
    catch (error) {
        next(error);
    }
});
/**
 * DELETE /api/tasks/:taskId
 * Delete a task
 */
router.delete('/tasks/:taskId', async (req, res, next) => {
    try {
        const taskId = req.params.taskId;
        await getStoryService().deleteTask(taskId);
        res.status(204).send();
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/sessions/:sessionSlug/hierarchy
 * Retrieve full session hierarchy (epics → stories → tasks)
 */
router.get('/sessions/:sessionSlug/hierarchy', async (req, res, next) => {
    try {
        const sessionSlug = req.params.sessionSlug;
        const hierarchy = await getStoryService().getSessionHierarchy(sessionSlug);
        if (!hierarchy) {
            throw new errors_1.NotFoundError(`Session with slug "${sessionSlug}" not found`, 'SESSION_NOT_FOUND');
        }
        res.json(hierarchy);
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/sessions/:sessionSlug/import-markdown
 * Import markdown and create hierarchy
 */
router.post('/sessions/:sessionSlug/import-markdown', async (req, res, next) => {
    try {
        const sessionSlug = req.params.sessionSlug;
        const { markdown } = req.body;
        // Validate input
        if (!markdown || markdown.trim().length === 0) {
            throw new errors_1.ValidationError('Markdown content is required', 'INVALID_MARKDOWN');
        }
        const result = await getStoryService().parseMarkdownImport(sessionSlug, markdown);
        res.status(201).json({
            epicsCreated: result.epicsCreated,
            storiesCreated: result.storiesCreated,
            tasksCreated: result.tasksCreated,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=stories.js.map