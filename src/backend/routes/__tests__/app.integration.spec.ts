import request from 'supertest';
import express from 'express';

describe('Express App Integration', () => {
  let app: any;

  beforeEach(() => {
    // Create fresh app for each test
    app = express();

    // Middleware
    app.use(express.json());

    // CORS middleware
    app.use((req: any, res: any, next: any) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    });

    // Health check
    app.get('/health', (req: any, res: any) => {
      res.json({ status: 'ok' });
    });

    // Dummy routes for testing
    app.get('/api/test', (req: any, res: any) => {
      res.json({ message: 'API working' });
    });

    // Error route for testing error handling
    app.get('/api/error', (req: any, res: any, next: any) => {
      const error = new Error('Test error');
      (error as any).status = 500;
      next(error);
    });

    // JSON parsing route for testing
    app.post('/api/test-body', (req: any, res: any) => {
      res.json({ received: req.body });
    });

    // Error handler middleware
    app.use((err: any, req: any, res: any, next: any) => {
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

    // 404 handler (should be last)
    app.use((req: any, res: any) => {
      res.status(404).json({
        error: {
          message: 'Route not found',
          code: 'NOT_FOUND',
          status: 404,
        },
      });
    });
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
    });
  });

  describe('Route Registration', () => {
    it('should have API routes available', async () => {
      const response = await request(app).get('/api/test');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('API working');
    });
  });

  describe('CORS Headers', () => {
    it('should include CORS headers in responses', async () => {
      const response = await request(app).get('/health');

      expect(response.headers['access-control-allow-origin']).toBe('*');
      expect(response.headers['access-control-allow-methods']).toBeDefined();
    });

    it('should handle OPTIONS requests', async () => {
      const response = await request(app).options('/health');

      expect(response.status).toBe(200);
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for undefined routes', async () => {
      const response = await request(app).get('/api/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('should return 404 JSON response for undefined routes', async () => {
      const response = await request(app).post('/api/undefined');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.status).toBe(404);
    });
  });

  describe('Error Handling', () => {
    it('should handle thrown errors properly', async () => {
      const response = await request(app).get('/api/error');

      expect(response.status).toBe(500);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('JSON Parsing', () => {
    it('should parse JSON request bodies', async () => {
      const response = await request(app).post('/api/test-body').send({
        key: 'value',
        number: 42,
      });

      expect(response.status).toBe(200);
      expect(response.body.received.key).toBe('value');
      expect(response.body.received.number).toBe(42);
    });
  });
});
