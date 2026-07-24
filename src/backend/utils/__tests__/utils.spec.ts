import { generateSlug, generateUniqueSlug } from '../slug';
import { validateTitle, validatePseudonym, calculateFibonacciStats } from '../validators';
import { parseMarkdown, escapeMarkdown } from '../markdown';

describe('Slug Utilities', () => {
  describe('generateSlug', () => {
    it('should convert to kebab-case', () => {
      expect(generateSlug('Hello World')).toBe('hello-world');
    });

    it('should remove special characters', () => {
      expect(generateSlug('Test@Session!')).toBe('testsession');
    });

    it('should handle multiple spaces', () => {
      expect(generateSlug('Test   Session   Name')).toBe('test-session-name');
    });

    it('should remove leading/trailing hyphens', () => {
      expect(generateSlug('  Test  ')).toBe('test');
    });
  });

  describe('generateUniqueSlug', () => {
    it('should include random suffix', () => {
      const slug = generateUniqueSlug('Test Session');
      expect(slug).toMatch(/^test-session-[a-z0-9]{4}$/);
    });

    it('should accept custom suffix', () => {
      const slug = generateUniqueSlug('Test', 'abc123');
      expect(slug).toBe('test-abc123');
    });
  });
});

describe('Validators', () => {
  describe('validateTitle', () => {
    it('should accept valid title', () => {
      expect(validateTitle('Valid Title')).toBe(true);
    });

    it('should reject empty title', () => {
      expect(validateTitle('')).toBe(false);
    });

    it('should reject title >255 chars', () => {
      const longTitle = 'a'.repeat(256);
      expect(validateTitle(longTitle)).toBe(false);
    });

    it('should reject title with null bytes', () => {
      expect(validateTitle('Test\0Title')).toBe(false);
    });

    it('should accept title exactly 255 chars', () => {
      const maxTitle = 'a'.repeat(255);
      expect(validateTitle(maxTitle)).toBe(true);
    });
  });

  describe('validatePseudonym', () => {
    it('should accept valid pseudonym', () => {
      expect(validatePseudonym('Alice')).toBe(true);
    });

    it('should reject empty pseudonym', () => {
      expect(validatePseudonym('')).toBe(false);
    });

    it('should reject pseudonym >50 chars', () => {
      const longName = 'a'.repeat(51);
      expect(validatePseudonym(longName)).toBe(false);
    });

    it('should accept pseudonym exactly 50 chars', () => {
      const maxName = 'a'.repeat(50);
      expect(validatePseudonym(maxName)).toBe(true);
    });
  });

  describe('calculateFibonacciStats', () => {
    it('should calculate average of Fibonacci values', () => {
      const values = [1, 3, 5];
      const stats = calculateFibonacciStats(values);
      expect(stats.average).toBe(3);
    });

    it('should calculate median of Fibonacci values', () => {
      const values = [1, 5, 8];
      const stats = calculateFibonacciStats(values);
      expect(stats.median).toBe(5);
    });

    it('should ignore "?" and "coffee" special cards', () => {
      const values = [1, 5, '?', 8, 'coffee'];
      const stats = calculateFibonacciStats(values);
      expect(stats.average).toBe((1 + 5 + 8) / 3);
    });

    it('should return null for no numeric values', () => {
      const values: (number | string)[] = ['?', 'coffee'];
      const stats = calculateFibonacciStats(values);
      expect(stats.average).toBeNull();
      expect(stats.median).toBeNull();
    });

    it('should handle even number of values for median', () => {
      const values = [1, 5, 8, 13];
      const stats = calculateFibonacciStats(values);
      expect(stats.median).toBe((5 + 8) / 2);
    });
  });
});

describe('Markdown Utilities', () => {
  describe('parseMarkdown', () => {
    it('should parse headings by level', () => {
      const md = `# Epic\n## Story\n### Task`;
      const nodes = parseMarkdown(md);
      expect(nodes).toHaveLength(3);
      expect(nodes[0].level).toBe(1);
      expect(nodes[1].level).toBe(2);
      expect(nodes[2].level).toBe(3);
    });

    it('should extract titles', () => {
      const md = `# My Epic\n## My Story`;
      const nodes = parseMarkdown(md);
      expect(nodes[0].title).toBe('My Epic');
      expect(nodes[1].title).toBe('My Story');
    });

    it('should ignore non-heading lines', () => {
      const md = `# Epic\nSome description\n## Story`;
      const nodes = parseMarkdown(md);
      expect(nodes).toHaveLength(2);
    });

    it('should handle extra spaces around titles', () => {
      const md = `#  Title with spaces  `;
      const nodes = parseMarkdown(md);
      expect(nodes[0].title).toBe('Title with spaces');
    });
  });

  describe('escapeMarkdown', () => {
    it('should escape asterisks', () => {
      expect(escapeMarkdown('*bold*')).toBe('\\*bold\\*');
    });

    it('should escape underscores', () => {
      expect(escapeMarkdown('_italic_')).toBe('\\_italic\\_');
    });

    it('should escape brackets', () => {
      expect(escapeMarkdown('[link](url)')).toContain('\\[');
      expect(escapeMarkdown('[link](url)')).toContain('\\]');
    });

    it('should escape hashes', () => {
      expect(escapeMarkdown('# Heading')).toBe('\\# Heading');
    });

    it('should escape multiple special characters', () => {
      const text = '**bold** _italic_ [link]';
      const escaped = escapeMarkdown(text);
      expect(escaped).toContain('\\*');
      expect(escaped).toContain('\\_');
      expect(escaped).toContain('\\[');
    });
  });
});
