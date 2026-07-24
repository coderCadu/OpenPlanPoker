"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = exports.disconnectPrisma = exports.getPrismaClient = void 0;
const client_1 = require("@prisma/client");
/**
 * Global Prisma Client singleton
 *
 * This prevents multiple instances of PrismaClient which can cause:
 * - Connection pool exhaustion
 * - Memory leaks from unreleased connections
 * - Degraded performance
 *
 * The singleton pattern ensures only one connection pool is used across
 * the entire application.
 */
let prismaClient = null;
/**
 * Get the Prisma Client instance
 * Creates singleton on first call, returns same instance on subsequent calls
 *
 * @returns PrismaClient singleton instance
 */
function getPrismaClient() {
    if (prismaClient === null) {
        prismaClient = new client_1.PrismaClient({
            // Log all queries in development for debugging
            log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
        });
    }
    return prismaClient;
}
exports.getPrismaClient = getPrismaClient;
/**
 * Disconnect Prisma Client
 * Should be called during application shutdown
 */
async function disconnectPrisma() {
    if (prismaClient !== null) {
        await prismaClient.$disconnect();
        prismaClient = null;
    }
}
exports.disconnectPrisma = disconnectPrisma;
// Export singleton instance
exports.prisma = getPrismaClient();
exports.default = {
    getPrismaClient,
    disconnectPrisma,
    prisma: exports.prisma,
};
//# sourceMappingURL=database.js.map