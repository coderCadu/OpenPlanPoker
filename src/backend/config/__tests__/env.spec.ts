import { getEnv, validateEnv } from '../env';

describe('Environment Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('validateEnv', () => {
    it('should succeed with all required environment variables', () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/test';
      process.env.PORT = '3000';
      process.env.NODE_ENV = 'development';

      expect(() => validateEnv()).not.toThrow();
    });

    it('should throw error when DATABASE_URL is missing', () => {
      delete process.env.DATABASE_URL;
      process.env.PORT = '3000';

      expect(() => validateEnv()).toThrow('DATABASE_URL environment variable is required');
    });

    it('should throw error when DATABASE_URL is empty', () => {
      process.env.DATABASE_URL = '';
      process.env.PORT = '3000';

      expect(() => validateEnv()).toThrow('DATABASE_URL environment variable is required');
    });

    it('should accept DATABASE_URL with valid PostgreSQL connection string', () => {
      const connectionStrings = [
        'postgresql://user:pass@localhost:5432/dbname',
        'postgres://user:pass@host:5432/dbname',
        'postgresql://localhost/dbname',
      ];

      connectionStrings.forEach((url) => {
        process.env.DATABASE_URL = url;
        expect(() => validateEnv()).not.toThrow();
      });
    });
  });

  describe('getEnv', () => {
    it('should return environment object with DATABASE_URL', () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/test';
      process.env.PORT = '3001';
      process.env.NODE_ENV = 'test';

      const env = getEnv();

      expect(env.DATABASE_URL).toBe('postgresql://user:pass@localhost:5432/test');
      expect(env.PORT).toBe(3001);
      expect(env.NODE_ENV).toBe('test');
    });

    it('should use default PORT of 3000', () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/test';
      delete process.env.PORT;

      const env = getEnv();

      expect(env.PORT).toBe(3000);
    });

    it('should use default NODE_ENV of development', () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/test';
      delete process.env.NODE_ENV;

      const env = getEnv();

      expect(env.NODE_ENV).toBe('development');
    });

    it('should throw error if DATABASE_URL is not set', () => {
      delete process.env.DATABASE_URL;

      expect(() => getEnv()).toThrow('DATABASE_URL environment variable is required');
    });

    it('should parse PORT as integer', () => {
      process.env.DATABASE_URL = 'postgresql://localhost/test';
      process.env.PORT = '5000';

      const env = getEnv();

      expect(env.PORT).toBe(5000);
      expect(typeof env.PORT).toBe('number');
    });

    it('should validate NODE_ENV is one of allowed values', () => {
      process.env.DATABASE_URL = 'postgresql://localhost/test';
      process.env.NODE_ENV = 'invalid_env';

      expect(() => getEnv()).toThrow();
    });
  });
});
