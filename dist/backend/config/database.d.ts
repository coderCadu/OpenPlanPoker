import { PrismaClient } from '@prisma/client';
/**
 * Get the Prisma Client instance
 * Creates singleton on first call, returns same instance on subsequent calls
 *
 * @returns PrismaClient singleton instance
 */
export declare function getPrismaClient(): PrismaClient;
/**
 * Disconnect Prisma Client
 * Should be called during application shutdown
 */
export declare function disconnectPrisma(): Promise<void>;
export declare const prisma: PrismaClient<import(".prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
declare const _default: {
    getPrismaClient: typeof getPrismaClient;
    disconnectPrisma: typeof disconnectPrisma;
    prisma: PrismaClient<import(".prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
};
export default _default;
//# sourceMappingURL=database.d.ts.map