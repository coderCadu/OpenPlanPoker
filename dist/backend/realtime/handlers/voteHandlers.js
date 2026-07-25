"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupVoteHandlers = void 0;
const logger_1 = require("../../utils/logger");
function setupVoteHandlers(socket, voteService, notificationService) {
    const { sessionId, pseudonym } = socket.data;
    const room = `session:${sessionId}`;
    socket.on('vote:cast', async (data) => {
        try {
            const { taskId, card } = data;
            if (!taskId) {
                socket.emit('error:vote', { message: 'Missing taskId' });
                return;
            }
            if (!card) {
                socket.emit('error:vote', { message: 'Missing card value' });
                return;
            }
            if (!voteService.validateCard(card)) {
                socket.emit('error:vote', { message: `Invalid card: ${card}` });
                return;
            }
            const vote = await voteService.recordVote(taskId, pseudonym, sessionId, card);
            socket.to(room).emit('vote:recorded', {
                taskId,
                participantId: pseudonym,
                card,
                timestamp: new Date(),
            });
            socket.emit('vote:recorded:self', {
                taskId,
                card,
                timestamp: new Date(),
            });
            logger_1.logger.info({ sessionId, taskId, pseudonym, card }, 'Vote cast via Socket');
        }
        catch (error) {
            logger_1.logger.error({ error: String(error), sessionId, taskId: data.taskId, pseudonym }, 'Failed to cast vote');
            socket.emit('error:vote', {
                message: error instanceof Error ? error.message : 'Failed to cast vote',
            });
        }
    });
    socket.on('vote:update', async (data) => {
        try {
            const { voteId, card } = data;
            if (!voteId) {
                socket.emit('error:vote', { message: 'Missing voteId' });
                return;
            }
            if (!card) {
                socket.emit('error:vote', { message: 'Missing card value' });
                return;
            }
            if (!voteService.validateCard(card)) {
                socket.emit('error:vote', { message: `Invalid card: ${card}` });
                return;
            }
            const vote = await voteService.updateVote(voteId, card);
            socket.to(room).emit('vote:updated', {
                voteId,
                card,
                timestamp: new Date(),
            });
            socket.emit('vote:updated:self', {
                voteId,
                card,
                timestamp: new Date(),
            });
            logger_1.logger.info({ sessionId, voteId, pseudonym, card }, 'Vote updated via Socket');
        }
        catch (error) {
            logger_1.logger.error({ error: String(error), sessionId, voteId: data.voteId, pseudonym }, 'Failed to update vote');
            socket.emit('error:vote', {
                message: error instanceof Error ? error.message : 'Failed to update vote',
            });
        }
    });
    socket.on('vote:reveal', async (data) => {
        try {
            const { taskId } = data;
            if (!taskId) {
                socket.emit('error:vote', { message: 'Missing taskId' });
                return;
            }
            const votes = await voteService.getAllVotes(taskId);
            const average = voteService.calculateAverage(votes);
            const median = voteService.calculateMedian(votes);
            // Mark task as voted on (all votes visible now)
            socket.to(room).emit('votes:revealed', {
                taskId,
                voteCount: votes.length,
                average,
                median,
                timestamp: new Date(),
            });
            // Also send to requester
            socket.emit('votes:revealed', {
                taskId,
                voteCount: votes.length,
                average,
                median,
                timestamp: new Date(),
            });
            logger_1.logger.info({ sessionId, taskId, voteCount: votes.length, average, median }, 'Votes revealed via Socket');
        }
        catch (error) {
            logger_1.logger.error({ error: String(error), sessionId, taskId: data.taskId, pseudonym }, 'Failed to reveal votes');
            socket.emit('error:vote', {
                message: error instanceof Error ? error.message : 'Failed to reveal votes',
            });
        }
    });
}
exports.setupVoteHandlers = setupVoteHandlers;
//# sourceMappingURL=voteHandlers.js.map