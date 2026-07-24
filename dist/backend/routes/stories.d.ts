import { StoryService } from '../services/StoryService';
declare const router: import("express-serve-static-core").Router;
declare class StoryServiceWrapper {
    private service;
    setService(service: StoryService): void;
    getService(): StoryService;
}
declare const serviceWrapper: StoryServiceWrapper;
export { serviceWrapper };
export default router;
//# sourceMappingURL=stories.d.ts.map