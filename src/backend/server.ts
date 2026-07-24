import express from 'express';
import dotenv from 'dotenv';
import sessionsRouter from './routes/sessions';
import storiesRouter from './routes/stories';
import votesRouter from './routes/votes';
import exportRouter from './routes/export';
import { logger } from './utils/logger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// CORS middleware
app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
  const allowedOrigins = ['localhost', 'localhost:3000', 'localhost:5173', '127.0.0.1'];
  const origin = req.headers.origin || '';

  if (
    allowedOrigins.some((allowed) => origin.includes(allowed)) ||
    process.env.NODE_ENV === 'development'
  ) {
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

// Export app for testing
export default app;

// Only start server if this file is run directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
