/**
 * Markdown parsing utilities for Planning Poker
 */
interface MarkdownNode {
    level: number;
    title: string;
    description?: string;
}
/**
 * Parse markdown string into hierarchy nodes
 */
export declare function parseMarkdown(markdown: string): MarkdownNode[];
/**
 * Escape special markdown characters
 */
export declare function escapeMarkdown(text: string): string;
declare const _default: {
    parseMarkdown: typeof parseMarkdown;
    escapeMarkdown: typeof escapeMarkdown;
};
export default _default;
//# sourceMappingURL=markdown.d.ts.map