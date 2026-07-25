import { ExportService } from '../services/ExportService';
declare const router: import("express-serve-static-core").Router;
declare class ExportServiceWrapper {
    private service;
    setService(service: ExportService): void;
    getService(): ExportService;
}
declare const serviceWrapper: ExportServiceWrapper;
export { serviceWrapper };
export default router;
//# sourceMappingURL=export.d.ts.map