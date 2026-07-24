import request from 'supertest';
import express from 'express';
import exportRouter, { serviceWrapper } from '../export';
import { NotFoundError } from '../../utils/errors';

let app: any;
let mockExportService: any;

beforeEach(() => {
  app = express();
  app.use(express.json());
  app.use('/api', exportRouter);

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

  // Create mock ExportService
  mockExportService = {
    generateMarkdown: jest.fn(),
  };

  // Inject mock service
  serviceWrapper.setService(mockExportService as any);
});

describe('Export Routes', () => {
  describe('GET /sessions/:sessionSlug/export/markdown', () => {
    it('should export session as markdown file', async () => {
      const markdownContent = `# Epic 1 (est: 5)
## Story 1 (est: 3)
### Task 1 (est: 2)
### Task 2 (no estimate)

Session exported on 2026-07-24
Participants: 3
Duration: 30 minutes`;

      mockExportService.generateMarkdown.mockResolvedValue(markdownContent);

      const response = await request(app).get('/api/sessions/test-session/export/markdown');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/markdown|text/);
      expect(response.text).toContain('Epic 1');
      expect(response.text).toContain('Story 1');
      expect(response.text).toContain('Task 1');
      expect(mockExportService.generateMarkdown).toHaveBeenCalledWith('test-session');
    });

    it('should include filename in content-disposition header', async () => {
      const markdownContent = '# Epic 1\n## Story 1\n### Task 1';
      mockExportService.generateMarkdown.mockResolvedValue(markdownContent);

      const response = await request(app).get('/api/sessions/test-session/export/markdown');

      expect(response.status).toBe(200);
      expect(response.headers['content-disposition']).toMatch(/attachment/);
      expect(response.headers['content-disposition']).toMatch(/test-session/);
    });

    it('should return 404 if session not found', async () => {
      mockExportService.generateMarkdown.mockRejectedValue(
        new NotFoundError('Session not found', 'SESSION_NOT_FOUND')
      );

      const response = await request(app).get('/api/sessions/nonexistent/export/markdown');

      expect(response.status).toBe(404);
    });

    it('should handle empty sessions', async () => {
      const markdownContent = '# Session with no estimates\n\nNo epics or stories defined.';
      mockExportService.generateMarkdown.mockResolvedValue(markdownContent);

      const response = await request(app).get('/api/sessions/empty-session/export/markdown');

      expect(response.status).toBe(200);
      expect(response.text).toContain('Session with no estimates');
    });

    it('should handle special characters in markdown', async () => {
      const markdownContent = `# Epic: User *Authentication*
## Story: Login & **Logout**
### Task: Implement \`OAuth2\``;

      mockExportService.generateMarkdown.mockResolvedValue(markdownContent);

      const response = await request(app).get('/api/sessions/special-chars/export/markdown');

      expect(response.status).toBe(200);
      expect(response.text).toContain('OAuth2');
    });
  });

  describe('Error handling', () => {
    it('should handle service errors', async () => {
      mockExportService.generateMarkdown.mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/api/sessions/test-session/export/markdown');

      expect(response.status).toBe(500);
    });
  });
});
