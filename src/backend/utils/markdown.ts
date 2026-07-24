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
export function parseMarkdown(markdown: string): MarkdownNode[] {
  const lines = markdown.split('\n');
  const nodes: MarkdownNode[] = [];

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

/**
 * Escape special markdown characters
 */
export function escapeMarkdown(text: string): string {
  const specialChars = ['\\', '*', '_', '[', ']', '(', ')', '#', '+', '-', '.', '!', '`', '~'];
  let escaped = text;

  specialChars.forEach((char) => {
    escaped = escaped.replace(new RegExp('\\' + char, 'g'), '\\' + char);
  });

  return escaped;
}

export default { parseMarkdown, escapeMarkdown };
