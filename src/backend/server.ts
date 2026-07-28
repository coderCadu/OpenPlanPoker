import express from 'express';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import sessionsRouter from './routes/sessions';
import storiesRouter from './routes/stories';
import votesRouter from './routes/votes';
import exportRouter from './routes/export';
import { initializeSocketServer } from './realtime/socketServer';
import { SessionService } from './services/SessionService';
import { logger } from './utils/logger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Origins allowed to call the API / connect via WebSocket in addition to local dev.
// Set ALLOWED_ORIGINS to a comma-separated list (e.g. your Vercel frontend URL) in production.
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
  ...(process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
];

// Create HTTP server for Socket.io
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
  },
});

// Initialize Socket.io server with session service
const sessionService = new SessionService();
initializeSocketServer(io, sessionService);

// Middleware
app.use(express.json());

// CORS middleware
app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
  const origin = req.headers.origin || '';

  if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
    res.header('Access-Control-Allow-Origin', origin || '*');
  }

  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Logging middleware
app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(
      {
        method: req.method,
        path: req.path,
        status: res.statusCode,
        duration,
      },
      `${req.method} ${req.path} ${res.statusCode}`
    );
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Routes
app.use('/api/sessions', sessionsRouter);
app.use('/api', storiesRouter);
app.use('/api', votesRouter);
app.use('/api', exportRouter);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const status = err.status || 500;
  const message = err.message || 'Internal server error';
  const code = err.code || 'INTERNAL_ERROR';

  logger.error(
    {
      error: err.message,
      status,
      path: req.path,
      method: req.method,
    },
    'Request error'
  );

  res.status(status).json({
    error: {
      message,
      code,
      status,
    },
  });
});

// 404 handler (must be last)
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({
    error: {
      message: 'Route not found',
      code: 'NOT_FOUND',
      status: 404,
    },
  });
});

// Export app and io for testing
export default app;
export { io, httpServer };

// Only start server if this file is run directly
if (require.main === module) {
  httpServer.listen(PORT, () => {
    console.log(`Server with WebSocket running on port ${PORT}`);
    logger.info({ port: PORT }, 'HTTP and WebSocket server started');
  });
}
