"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEnv = exports.validateEnv = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load .env file
dotenv_1.default.config({ path: path_1.default.resolve(process.cwd(), '.env') });
/**
 * Validate that all required environment variables are present
 * Throws an error if validation fails
 */
function validateEnv() {
    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.trim() === '') {
        throw new Error('DATABASE_URL environment variable is required');
    }
    const nodeEnv = process.env.NODE_ENV || 'development';
    if (!['development', 'test', 'production'].includes(nodeEnv)) {
        throw new Error(`NODE_ENV must be one of: development, test, production. Got: ${nodeEnv}`);
    }
}
exports.validateEnv = validateEnv;
/**
 * Get validated environment configuration
 * Throws an error if any required variable is missing or invalid
 */
function getEnv() {
    validateEnv();
    const port = parseInt(process.env.PORT || '3000', 10);
    if (isNaN(port)) {
        throw new Error(`PORT must be a valid number. Got: ${process.env.PORT}`);
    }
    const nodeEnv = (process.env.NODE_ENV || 'development');
    return {
        DATABASE_URL: process.env.DATABASE_URL,
        PORT: port,
        NODE_ENV: nodeEnv,
    };
}
exports.getEnv = getEnv;
// Validate environment on module load
validateEnv();
exports.default = {
    getEnv,
    validateEnv,
};
//# sourceMappingURL=env.js.map