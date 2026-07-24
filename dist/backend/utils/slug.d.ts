/**
 * Slug generation and utilities
 */
/**
 * Generate a kebab-case slug from text
 */
export declare function generateSlug(text: string): string;
/**
 * Slugify text with random suffix for uniqueness
 */
export declare function generateUniqueSlug(text: string, suffix?: string): string;
declare const _default: {
    generateSlug: typeof generateSlug;
    generateUniqueSlug: typeof generateUniqueSlug;
};
export default _default;
//# sourceMappingURL=slug.d.ts.map