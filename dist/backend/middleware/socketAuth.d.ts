import { Socket } from 'socket.io';
/**
 * Socket.io authentication middleware
 * Validates session slug and pseudonym before allowing connection
 */
export declare function socketAuthMiddleware(socket: Socket, next: (err?: Error) => void): Promise<void>;
//# sourceMappingURL=socketAuth.d.ts.map