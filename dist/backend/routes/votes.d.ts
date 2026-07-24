import { VoteService } from '../services/VoteService';
declare const router: import("express-serve-static-core").Router;
declare class VoteServiceWrapper {
    private service;
    setService(service: VoteService): void;
    getService(): VoteService;
}
declare const serviceWrapper: VoteServiceWrapper;
export { serviceWrapper };
export default router;
//# sourceMappingURL=votes.d.ts.map