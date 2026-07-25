"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serviceWrapper = void 0;
const express_1 = require("express");
const ExportService_1 = require("../services/ExportService");
const router = (0, express_1.Router)();
// Create a wrapper to allow service injection for testing
class ExportServiceWrapper {
    constructor() {
        this.service = new ExportService_1.ExportService();
    }
    setService(service) {
        this.service = service;
    }
    getService() {
        return this.service;
    }
}
const serviceWrapper = new ExportServiceWrapper();
exports.serviceWrapper = serviceWrapper;
function getExportService() {
    return serviceWrapper.getService();
}
/**
 * GET /api/sessions/:sessionSlug/export/markdown
 * Export session as markdown file
 */
router.get('/sessions/:sessionSlug/export/markdown', async (req, res, next) => {
    try {
        const sessionSlug = req.params.sessionSlug;
        // Generate markdown content
        const markdown = await getExportService().generateMarkdown(sessionSlug);
        // Set response headers for file download
        const filename = `session-${sessionSlug}-${new Date().toISOString().split('T')[0]}.md`;
        res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        // Send markdown as response body
        res.send(markdown);
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=export.js.map