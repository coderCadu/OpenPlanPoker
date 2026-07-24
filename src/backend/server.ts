import express from 'express';
import dotenv from 'dotenv';
import sessionsRouter from './routes/sessions';
import storiesRouter from './routes/stories';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Routes
app.use('/api/sessions', sessionsRouter);
app.use('/api', storiesRouter);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const status = err.status || 500;
  const message = err.message || 'Internal server error';
  const code = err.code || 'INTERNAL_ERROR';

  res.status(status).json({
    error: {
      message,
      code,
      status,
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
