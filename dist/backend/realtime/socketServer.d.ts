import { Server as SocketIOServer } from 'socket.io';
import { SessionService } from '../services/SessionService';
interface ConnectionMetadata {
    sessionId: string;
    pseudonym: string;
    connectedAt: Date;
}
export declare function initializeSocketServer(io: SocketIOServer, sessionService: SessionService): SocketIOServer;
export declare function getActiveConnections(sessionId: string): ConnectionMetadata[];
export declare function clearAllConnections(): void;
export {};
//# sourceMappingURL=socketServer.d.ts.map