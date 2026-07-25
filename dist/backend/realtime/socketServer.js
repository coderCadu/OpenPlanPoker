"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearAllConnections = exports.getActiveConnections = exports.initializeSocketServer = void 0;
const logger_1 = require("../utils/logger");
const database_1 = require("../config/database");
const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const DISCONNECT_GRACE_PERIOD = 15000; // 15 seconds
const connectionMetadata = new Map();
const pendingDisconnects = new Map();
function initializeSocketServer(io, sessionService) {
    // Authentication middleware
    io.use(async (socket, next) => {
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
            // Store metadata for later use
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
    });
    // Connection handler
    io.on('connection', async (socket) => {
        const { sessionId, pseudonym, sessionSlug } = socket.data;
        const roomName = `session:${sessionId}`;
        try {
            // Join room for this session
            socket.join(roomName);
            // Store connection metadata
            connectionMetadata.set(socket.id, {
                sessionId,
                pseudonym,
                connectedAt: new Date(),
            });
            // Clear any pending disconnect for this socket
            const pendingDisconnect = pendingDisconnects.get(socket.id);
            if (pendingDisconnect) {
                clearTimeout(pendingDisconnect);
                pendingDisconnects.delete(socket.id);
            }
            logger_1.logger.info({ socketId: socket.id, sessionId, pseudonym, room: roomName }, 'Socket connected to room');
            // Send welcome/sync event to client
            socket.emit('socket:connected', {
                socketId: socket.id,
                sessionId,
                pseudonym,
                timestamp: new Date(),
            });
            // Handle disconnect
            socket.on('disconnect', () => {
                handleDisconnect(socket.id, sessionId, pseudonym);
            });
            // Heartbeat ping (server → client)
            const heartbeatInterval = setInterval(() => {
                if (socket.connected) {
                    socket.emit('heartbeat:ping', { timestamp: new Date() });
                }
                else {
                    clearInterval(heartbeatInterval);
                }
            }, HEARTBEAT_INTERVAL);
            socket.on('disconnect', () => {
                clearInterval(heartbeatInterval);
            });
            // Heartbeat pong response (client → server confirms alive)
            socket.on('heartbeat:pong', () => {
                // Client acknowledged heartbeat; connection is alive
                const metadata = connectionMetadata.get(socket.id);
                if (metadata) {
                    logger_1.logger.debug({ socketId: socket.id }, 'Heartbeat pong received');
                }
            });
        }
        catch (error) {
            logger_1.logger.error({ error: String(error), socketId: socket.id, sessionId, pseudonym }, 'Error during socket connection');
            socket.disconnect(true);
        }
    });
    return io;
}
exports.initializeSocketServer = initializeSocketServer;
function handleDisconnect(socketId, sessionId, pseudonym) {
    const metadata = connectionMetadata.get(socketId);
    try {
        logger_1.logger.info({ socketId, sessionId, pseudonym }, 'Socket disconnected');
        // Set grace period: remove participant after delay unless they reconnect
        const timeoutId = setTimeout(() => {
            connectionMetadata.delete(socketId);
            pendingDisconnects.delete(socketId);
            logger_1.logger.info({ socketId, sessionId, pseudonym }, 'Participant marked as left after grace period');
        }, DISCONNECT_GRACE_PERIOD);
        pendingDisconnects.set(socketId, timeoutId);
    }
    catch (error) {
        logger_1.logger.error({ error: String(error), socketId, sessionId }, 'Error handling socket disconnect');
    }
}
function getActiveConnections(sessionId) {
    return Array.from(connectionMetadata.values()).filter((meta) => meta.sessionId === sessionId);
}
exports.getActiveConnections = getActiveConnections;
function clearAllConnections() {
    connectionMetadata.clear();
    pendingDisconnects.forEach((timeoutId) => clearTimeout(timeoutId));
    pendingDisconnects.clear();
}
exports.clearAllConnections = clearAllConnections;
//# sourceMappingURL=socketServer.js.map