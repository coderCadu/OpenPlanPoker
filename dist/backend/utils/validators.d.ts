/**
 * Validation utilities for Planning Poker
 */
/**
 * Validate title (max 255 chars, no null bytes)
 */
export declare function validateTitle(title: string): boolean;
/**
 * Validate pseudonym (max 50 chars, not empty)
 */
export declare function validatePseudonym(pseudonym: string): boolean;
/**
 * Calculate Fibonacci statistics, ignoring special cards
 */
export declare function calculateFibonacciStats(values: (number | string)[]): {
    average: number | null;
    median: number | null;
};
declare const _default: {
    validateTitle: typeof validateTitle;
    validatePseudonym: typeof validatePseudonym;
    calculateFibonacciStats: typeof calculateFibonacciStats;
};
export default _default;
//# sourceMappingURL=validators.d.ts.map