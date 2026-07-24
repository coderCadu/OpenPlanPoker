/**
 * Validation utilities for Planning Poker
 */

/**
 * Validate title (max 255 chars, no null bytes)
 */
export function validateTitle(title: string): boolean {
  if (!title || title.length === 0) return false;
  if (title.length > 255) return false;
  if (title.includes('\0')) return false;
  return true;
}

/**
 * Validate pseudonym (max 50 chars, not empty)
 */
export function validatePseudonym(pseudonym: string): boolean {
  if (!pseudonym || pseudonym.length === 0) return false;
  if (pseudonym.length > 50) return false;
  return true;
}

/**
 * Calculate Fibonacci statistics, ignoring special cards
 */
export function calculateFibonacciStats(values: (number | string)[]): {
  average: number | null;
  median: number | null;
} {
  const numeric = values
    .filter((v) => typeof v === 'number' && v > 0)
    .map((v) => v as number)
    .sort((a, b) => a - b);

  if (numeric.length === 0) {
    return { average: null, median: null };
  }

  const average = numeric.reduce((a, b) => a + b, 0) / numeric.length;
  const median =
    numeric.length % 2 === 0
      ? (numeric[numeric.length / 2 - 1] + numeric[numeric.length / 2]) / 2
      : numeric[Math.floor(numeric.length / 2)];

  return { average, median };
}

export default { validateTitle, validatePseudonym, calculateFibonacciStats };
