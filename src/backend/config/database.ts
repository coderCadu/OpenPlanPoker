import { PrismaClient } from '@prisma/client';

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
let prismaClient: PrismaClient | null = null;

/**
 * Get the Prisma Client instance
 * Creates singleton on first call, returns same instance on subsequent calls
 *
 * @returns PrismaClient singleton instance
 */
export function getPrismaClient(): PrismaClient {
  if (prismaClient === null) {
    prismaClient = new PrismaClient({
      // Log all queries in development for debugging
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  }
  return prismaClient;
}

/**
 * Disconnect Prisma Client
 * Should be called during application shutdown
 */
export async function disconnectPrisma(): Promise<void> {
  if (prismaClient !== null) {
    await prismaClient.$disconnect();
    prismaClient = null;
  }
}

// Export singleton instance
export const prisma = getPrismaClient();

export default {
  getPrismaClient,
  disconnectPrisma,
  prisma,
};
