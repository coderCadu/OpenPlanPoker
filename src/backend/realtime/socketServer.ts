import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { SessionService } from '../services/SessionService';
import { NotificationService } from '../services/NotificationService';
import { ChatService } from '../services/ChatService';
import { VoteService } from '../services/VoteService';
import { setupChatHandlers } from './handlers/chatHandlers';
import { setupVoteHandlers } from './handlers/voteHandlers';
import { setupNotificationHandlers } from './handlers/notificationHandlers';
import { logger } from '../utils/logger';
import { prisma } from '../config/database';

const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const DISCONNECT_GRACE_PERIOD = 15000; // 15 seconds

// Track connections for graceful disconnects
interface ConnectionMetadata {
  sessionId: string;
  pseudonym: string;
  connectedAt: Date;
}

const connectionMetadata = new Map<string, ConnectionMetadata>();
const pendingDisconnects = new Map<string, NodeJS.Timeout>();

export function initializeSocketServer(
  io: SocketIOServer,
  sessionService: SessionService
): SocketIOServer {
  const chatService = new ChatService();
  const voteService = new VoteService();
  const notificationService = new NotificationService(io);

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
      const session = await prisma.session.findUnique({
        where: { slug },
      });

      if (!session) {
        return next(new Error(`Session "${slug}" not found`));
      }

      if (session.status !== 'ACTIVE') {
        return next(new Error(`Session "${slug}" is ${session.status.toLowerCase()}`));
      }

      // Lookup participant record (must have joined via REST /join beforehand)
      const participant = await prisma.participant.findUnique({
        where: { sessionId_pseudonym: { sessionId: session.id, pseudonym } },
      });

      if (!participant) {
        return next(new Error(`Participant "${pseudonym}" has not joined session "${slug}"`));
      }

      // Store metadata for later use
      socket.data.sessionId = session.id;
      socket.data.pseudonym = pseudonym;
      socket.data.sessionSlug = slug;
      socket.data.participantId = participant.id;

      logger.info({ sessionId: session.id, pseudonym }, 'Socket connection authenticated');
      next();
    } catch (error) {
      logger.error({ error: String(error) }, 'Socket authentication failed');
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

      logger.info(
        { socketId: socket.id, sessionId, pseudonym, room: roomName },
        'Socket connected to room'
      );

      // Send welcome/sync event to client
      socket.emit('socket:connected', {
        socketId: socket.id,
        sessionId,
        pseudonym,
        timestamp: new Date(),
      });

      // Register feature handlers (chat, voting, notifications) for this socket
      setupChatHandlers(socket, chatService);
      setupVoteHandlers(socket, voteService, notificationService);
      setupNotificationHandlers(socket, notificationService);

      // Handle disconnect
      socket.on('disconnect', () => {
        handleDisconnect(socket.id, sessionId, pseudonym);
      });

      // Heartbeat ping (server → client)
      const heartbeatInterval = setInterval(() => {
        if (socket.connected) {
          socket.emit('heartbeat:ping', { timestamp: new Date() });
        } else {
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
          logger.debug({ socketId: socket.id }, 'Heartbeat pong received');
        }
      });
    } catch (error) {
      logger.error(
        { error: String(error), socketId: socket.id, sessionId, pseudonym },
        'Error during socket connection'
      );
      socket.disconnect(true);
    }
  });

  return io;
}

function handleDisconnect(socketId: string, sessionId: string, pseudonym: string): void {
  const metadata = connectionMetadata.get(socketId);

  try {
    logger.info({ socketId, sessionId, pseudonym }, 'Socket disconnected');

    // Set grace period: remove participant after delay unless they reconnect
    const timeoutId = setTimeout(() => {
      connectionMetadata.delete(socketId);
      pendingDisconnects.delete(socketId);

      logger.info({ socketId, sessionId, pseudonym }, 'Participant marked as left after grace period');
    }, DISCONNECT_GRACE_PERIOD);

    pendingDisconnects.set(socketId, timeoutId);
  } catch (error) {
    logger.error(
      { error: String(error), socketId, sessionId },
      'Error handling socket disconnect'
    );
  }
}

export function getActiveConnections(sessionId: string): ConnectionMetadata[] {
  return Array.from(connectionMetadata.values()).filter(
    (meta) => meta.sessionId === sessionId
  );
}

export function clearAllConnections(): void {
  connectionMetadata.clear();
  pendingDisconnects.forEach((timeoutId) => clearTimeout(timeoutId));
  pendingDisconnects.clear();
}
