"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketAuthMiddleware = void 0;
const database_1 = require("../config/database");
const logger_1 = require("../utils/logger");
/**
 * Socket.io authentication middleware
 * Validates session slug and pseudonym before allowing connection
 */
async function socketAuthMiddleware(socket, next) {
    try {
        const { slug, pseudonym } = socket.handshake.auth;
        // Validate presence
        if (!slug) {
            return next(new Error('Missing session slug in auth'));
        }
        if (!pseudonym) {
            return next(new Error('Missing pseudonym in auth'));
        }
        // Lookup session by slug
        const session = await database_1.prisma.session.findUnique({
            where: { slug },
        });
        if (!session) {
            return next(new Error(`Session "${slug}" not found`));
        }
        if (session.status !== 'ACTIVE') {
            return next(new Error(`Session "${slug}" is ${session.status.toLowerCase()}`));
        }
        // Attach to socket for use in event handlers
        socket.data.sessionId = session.id;
        socket.data.pseudonym = pseudonym;
        socket.data.sessionSlug = slug;
        logger_1.logger.info({ sessionId: session.id, pseudonym }, 'Socket connection authenticated');
        next();
    }
    catch (error) {
        logger_1.logger.error({ error: String(error) }, 'Socket authentication failed');
        next(new Error('Authentication failed'));
    }
}
exports.socketAuthMiddleware = socketAuthMiddleware;
//# sourceMappingURL=socketAuth.js.map