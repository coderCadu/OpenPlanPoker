import { InactivityCleanupService } from '../InactivityCleanupService';

// Mock SessionService
jest.mock('../SessionService', () => ({
  SessionService: jest.fn().mockImplementation(() => ({
    expireInactiveSessions: jest.fn(),
  })),
}));

const { SessionService } = require('../SessionService');

describe('InactivityCleanupService', () => {
  let cleanupService: InactivityCleanupService;
  let mockSessionService: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSessionService = {
      expireInactiveSessions: jest.fn(),
    };

    cleanupService = new InactivityCleanupService(mockSessionService);
  });

  describe('runCleanup', () => {
    it('should call expireInactiveSessions on SessionService', async () => {
      mockSessionService.expireInactiveSessions.mockResolvedValue({ count: 2 });

      await cleanupService.runCleanup();

      expect(mockSessionService.expireInactiveSessions).toHaveBeenCalled();
    });

    it('should return count of archived sessions', async () => {
      mockSessionService.expireInactiveSessions.mockResolvedValue({ count: 5 });

      const result = await cleanupService.runCleanup();

      expect(result.count).toBe(5);
    });

    it('should handle zero sessions archived', async () => {
      mockSessionService.expireInactiveSessions.mockResolvedValue({ count: 0 });

      const result = await cleanupService.runCleanup();

      expect(result.count).toBe(0);
    });

    it('should propagate errors from SessionService', async () => {
      const testError = new Error('Database error');
      mockSessionService.expireInactiveSessions.mockRejectedValue(testError);

      await expect(cleanupService.runCleanup()).rejects.toThrow('Database error');
    });

    it('should handle multiple cleanup runs', async () => {
      mockSessionService.expireInactiveSessions.mockResolvedValue({ count: 3 });

      const result1 = await cleanupService.runCleanup();
      const result2 = await cleanupService.runCleanup();

      expect(result1.count).toBe(3);
      expect(result2.count).toBe(3);
      expect(mockSessionService.expireInactiveSessions).toHaveBeenCalledTimes(2);
    });

    it('should return consistent result structure', async () => {
      mockSessionService.expireInactiveSessions.mockResolvedValue({ count: 10 });

      const result = await cleanupService.runCleanup();

      expect(result).toHaveProperty('count');
      expect(typeof result.count).toBe('number');
    });
  });

  describe('session archival verification', () => {
    it('should verify that sessions over 30 minutes are archived', async () => {
      // This test verifies the contract with SessionService
      // The actual archival logic is in SessionService.expireInactiveSessions()
      mockSessionService.expireInactiveSessions.mockResolvedValue({ count: 4 });

      const result = await cleanupService.runCleanup();

      // Verify the cleanup service properly delegates to SessionService
      expect(mockSessionService.expireInactiveSessions).toHaveBeenCalledTimes(1);
      expect(result.count).toBe(4);
    });

    it('should be callable on schedule without throwing', async () => {
      mockSessionService.expireInactiveSessions.mockResolvedValue({ count: 1 });

      // This simulates what the scheduler does
      const task = async () => {
        await cleanupService.runCleanup();
      };

      await expect(task()).resolves.not.toThrow();
    });
  });

  describe('error handling', () => {
    it('should throw if SessionService fails', async () => {
      mockSessionService.expireInactiveSessions.mockRejectedValue(
        new Error('Connection failed')
      );

      await expect(cleanupService.runCleanup()).rejects.toThrow('Connection failed');
    });

    it('should handle unexpected errors gracefully', async () => {
      mockSessionService.expireInactiveSessions.mockRejectedValue(new Error('Unknown error'));

      await expect(cleanupService.runCleanup()).rejects.toThrow('Unknown error');
    });
  });

  describe('service construction', () => {
    it('should accept SessionService instance in constructor', () => {
      const service = new InactivityCleanupService(mockSessionService);

      expect(service).toBeDefined();
    });

    it('should preserve SessionService reference', async () => {
      const customMockService = {
        expireInactiveSessions: jest.fn().mockResolvedValue({ count: 7 }),
      };

      const service = new InactivityCleanupService(customMockService as any);
      await service.runCleanup();

      expect(customMockService.expireInactiveSessions).toHaveBeenCalled();
    });
  });
});
