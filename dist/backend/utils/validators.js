"use strict";
/**
 * Validation utilities for Planning Poker
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateFibonacciStats = exports.validatePseudonym = exports.validateTitle = void 0;
/**
 * Validate title (max 255 chars, no null bytes)
 */
function validateTitle(title) {
    if (!title || title.length === 0)
        return false;
    if (title.length > 255)
        return false;
    if (title.includes('\0'))
        return false;
    return true;
}
exports.validateTitle = validateTitle;
/**
 * Validate pseudonym (max 50 chars, not empty)
 */
function validatePseudonym(pseudonym) {
    if (!pseudonym || pseudonym.length === 0)
        return false;
    if (pseudonym.length > 50)
        return false;
    return true;
}
exports.validatePseudonym = validatePseudonym;
/**
 * Calculate Fibonacci statistics, ignoring special cards
 */
function calculateFibonacciStats(values) {
    const numeric = values
        .filter((v) => typeof v === 'number' && v > 0)
        .map((v) => v)
        .sort((a, b) => a - b);
    if (numeric.length === 0) {
        return { average: null, median: null };
    }
    const average = numeric.reduce((a, b) => a + b, 0) / numeric.length;
    const median = numeric.length % 2 === 0
        ? (numeric[numeric.length / 2 - 1] + numeric[numeric.length / 2]) / 2
        : numeric[Math.floor(numeric.length / 2)];
    return { average, median };
}
exports.calculateFibonacciStats = calculateFibonacciStats;
exports.default = { validateTitle, validatePseudonym, calculateFibonacciStats };
//# sourceMappingURL=validators.js.map