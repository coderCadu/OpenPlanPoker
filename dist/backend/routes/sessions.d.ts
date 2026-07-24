import { SessionService } from '../services/SessionService';
declare const router: import("express-serve-static-core").Router;
declare class SessionServiceWrapper {
    private service;
    setService(service: SessionService): void;
    getService(): SessionService;
}
declare const serviceWrapper: SessionServiceWrapper;
export { serviceWrapper };
export default router;
//# sourceMappingURL=sessions.d.ts.map