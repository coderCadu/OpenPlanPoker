"use strict";
/**
 * Slug generation and utilities
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateUniqueSlug = exports.generateSlug = void 0;
/**
 * Generate a kebab-case slug from text
 */
function generateSlug(text) {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/[\s_]+/g, '-') // Replace spaces/underscores with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens
        .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}
exports.generateSlug = generateSlug;
/**
 * Slugify text with random suffix for uniqueness
 */
function generateUniqueSlug(text, suffix) {
    const base = generateSlug(text);
    const randomSuffix = suffix || Math.random().toString(36).substring(2, 6);
    return `${base}-${randomSuffix}`;
}
exports.generateUniqueSlug = generateUniqueSlug;
exports.default = { generateSlug, generateUniqueSlug };
//# sourceMappingURL=slug.js.map