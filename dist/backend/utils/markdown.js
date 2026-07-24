"use strict";
/**
 * Markdown parsing utilities for Planning Poker
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.escapeMarkdown = exports.parseMarkdown = void 0;
/**
 * Parse markdown string into hierarchy nodes
 */
function parseMarkdown(markdown) {
    const lines = markdown.split('\n');
    const nodes = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const match = line.match(/^(#+)\s+(.+)$/);
        if (match) {
            nodes.push({
                level: match[1].length,
                title: match[2].trim(),
            });
        }
    }
    return nodes;
}
exports.parseMarkdown = parseMarkdown;
/**
 * Escape special markdown characters
 */
function escapeMarkdown(text) {
    const specialChars = ['\\', '*', '_', '[', ']', '(', ')', '#', '+', '-', '.', '!', '`', '~'];
    let escaped = text;
    specialChars.forEach((char) => {
        escaped = escaped.replace(new RegExp('\\' + char, 'g'), '\\' + char);
    });
    return escaped;
}
exports.escapeMarkdown = escapeMarkdown;
exports.default = { parseMarkdown, escapeMarkdown };
//# sourceMappingURL=markdown.js.map