interface Environment {
    DATABASE_URL: string;
    PORT: number;
    NODE_ENV: 'development' | 'test' | 'production';
}
/**
 * Validate that all required environment variables are present
 * Throws an error if validation fails
 */
export declare function validateEnv(): void;
/**
 * Get validated environment configuration
 * Throws an error if any required variable is missing or invalid
 */
export declare function getEnv(): Environment;
declare const _default: {
    getEnv: typeof getEnv;
    validateEnv: typeof validateEnv;
};
export default _default;
//# sourceMappingURL=env.d.ts.map