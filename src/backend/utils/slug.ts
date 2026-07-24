/**
 * Slug generation and utilities
 */

/**
 * Generate a kebab-case slug from text
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')           // Remove special characters
    .replace(/[\s_]+/g, '-')             // Replace spaces/underscores with hyphens
    .replace(/-+/g, '-')                 // Replace multiple hyphens
    .replace(/^-|-$/g, '');              // Remove leading/trailing hyphens
}

/**
 * Slugify text with random suffix for uniqueness
 */
export function generateUniqueSlug(text: string, suffix?: string): string {
  const base = generateSlug(text);
  const randomSuffix = suffix || Math.random().toString(36).substring(2, 6);
  return `${base}-${randomSuffix}`;
}

export default { generateSlug, generateUniqueSlug };
