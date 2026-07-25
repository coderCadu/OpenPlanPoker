import { Socket } from 'socket.io';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

/**
 * Socket.io authentication middleware
 * Validates session slug and pseudonym before allowing connection
 */
export async function socketAuthMiddleware(socket: Socket, next: (err?: Error) => void): Promise<void> {
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

    // Attach to socket for use in event handlers
    socket.data.sessionId = session.id;
    socket.data.pseudonym = pseudonym;
    socket.data.sessionSlug = slug;

    logger.info({ sessionId: session.id, pseudonym }, 'Socket connection authenticated');
    next();
  } catch (error) {
    logger.error({ error: String(error) }, 'Socket authentication failed');
    next(new Error('Authentication failed'));
  }
}
