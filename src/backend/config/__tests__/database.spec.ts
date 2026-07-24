import { PrismaClient } from '@prisma/client';

// Mock Prisma Client
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    $connect: jest.fn().mockResolvedValue(undefined),
    $disconnect: jest.fn().mockResolvedValue(undefined),
  })),
}));

describe('Database Configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  describe('getPrismaClient', () => {
    it('should return a Prisma client instance', () => {
      const { getPrismaClient } = require('../database');
      const client = getPrismaClient();

      expect(client).toBeDefined();
      expect(client).toHaveProperty('$connect');
      expect(client).toHaveProperty('$disconnect');
    });

    it('should return the same instance on multiple calls (singleton)', () => {
      const { getPrismaClient } = require('../database');
      const client1 = getPrismaClient();
      const client2 = getPrismaClient();
      const client3 = getPrismaClient();

      expect(client1).toBe(client2);
      expect(client2).toBe(client3);
    });

    it('should have correct methods for transaction and connection management', () => {
      const { getPrismaClient } = require('../database');
      const client = getPrismaClient();

      expect(typeof client.$connect).toBe('function');
      expect(typeof client.$disconnect).toBe('function');
    });

    it('should be usable in try-finally blocks for graceful shutdown', async () => {
      const { getPrismaClient, disconnectPrisma } = require('../database');
      const client = getPrismaClient();

      // Mock the disconnect
      const disconnectSpy = jest.spyOn(client, '$disconnect');

      await disconnectPrisma();

      expect(disconnectSpy).toHaveBeenCalled();
    });

    it('should not create new instances across multiple module imports', () => {
      const module1 = require('../database');
      const client1 = module1.getPrismaClient();

      // Clear mocks but keep module
      jest.clearAllMocks();

      // Get another client from same module
      const client2 = module1.getPrismaClient();

      // Should be same instance
      expect(client1).toBe(client2);
    });
  });
});
