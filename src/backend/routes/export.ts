import { Router, Request, Response, NextFunction } from 'express';
import { ExportService } from '../services/ExportService';
import { logger } from '../utils/logger';

const router = Router();

// Create a wrapper to allow service injection for testing
class ExportServiceWrapper {
  private service = new ExportService();

  setService(service: ExportService) {
    this.service = service;
  }

  getService(): ExportService {
    return this.service;
  }
}

const serviceWrapper = new ExportServiceWrapper();

function getExportService(): ExportService {
  return serviceWrapper.getService();
}

export { serviceWrapper };

/**
 * GET /api/sessions/:sessionSlug/export/markdown
 * Export session as markdown file
 */
router.get(
  '/sessions/:sessionSlug/export/markdown',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sessionSlug = req.params.sessionSlug as string;

      // Generate markdown content
      const markdown = await getExportService().generateMarkdown(sessionSlug);

      // Set response headers for file download
      const filename = `session-${sessionSlug}-${new Date().toISOString().split('T')[0]}.md`;
      res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      // Send markdown as response body
      res.send(markdown);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
