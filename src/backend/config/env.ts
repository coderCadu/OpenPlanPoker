import dotenv from 'dotenv';
import path from 'path';

// Load .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

interface Environment {
  DATABASE_URL: string;
  PORT: number;
  NODE_ENV: 'development' | 'test' | 'production';
}

/**
 * Validate that all required environment variables are present
 * Throws an error if validation fails
 */
export function validateEnv(): void {
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.trim() === '') {
    throw new Error('DATABASE_URL environment variable is required');
  }

  const nodeEnv = process.env.NODE_ENV || 'development';
  if (!['development', 'test', 'production'].includes(nodeEnv)) {
    throw new Error(`NODE_ENV must be one of: development, test, production. Got: ${nodeEnv}`);
  }
}

/**
 * Get validated environment configuration
 * Throws an error if any required variable is missing or invalid
 */
export function getEnv(): Environment {
  validateEnv();

  const port = parseInt(process.env.PORT || '3000', 10);
  if (isNaN(port)) {
    throw new Error(`PORT must be a valid number. Got: ${process.env.PORT}`);
  }

  const nodeEnv = (process.env.NODE_ENV || 'development') as 'development' | 'test' | 'production';

  return {
    DATABASE_URL: process.env.DATABASE_URL!,
    PORT: port,
    NODE_ENV: nodeEnv,
  };
}

// Validate environment on module load
validateEnv();

export default {
  getEnv,
  validateEnv,
};
