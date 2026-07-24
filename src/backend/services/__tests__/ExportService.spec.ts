import { ExportService } from '../ExportService';

jest.mock('../../config/database', () => ({
  prisma: {
    session: {
      findUnique: jest.fn(),
    },
  },
}));

const { prisma } = require('../../config/database');

describe('ExportService', () => {
  let service: ExportService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ExportService();
  });

  describe('generateMarkdown', () => {
    it('should generate markdown with session metadata', async () => {
      const now = new Date();
      prisma.session.findUnique.mockResolvedValue({
        id: 'session-1',
        name: 'Sprint Planning',
        slug: 'sprint-planning',
        createdAt: now,
        updatedAt: new Date(now.getTime() + 60000), // 1 minute later
        participants: [{ pseudonym: 'Alice' }, { pseudonym: 'Bob' }],
        epics: [],
      });

      const markdown = await service.generateMarkdown('session-1');

      expect(markdown).toContain('# Planning Poker Session: Sprint Planning');
      expect(markdown).toContain('**Session ID:** sprint-planning');
      expect(markdown).toContain('**Participants:** Alice, Bob');
      expect(markdown).toContain('**Duration:**');
    });

    it('should include epic with estimate', async () => {
      prisma.session.findUnique.mockResolvedValue({
        id: 'session-1',
        name: 'Test',
        slug: 'test',
        createdAt: new Date(),
        updatedAt: new Date(),
        participants: [],
        epics: [
          {
            id: 'epic-1',
            title: 'Backend API',
            estimatePoints: 13,
            description: null,
            stories: [],
          },
        ],
      });

      const markdown = await service.generateMarkdown('session-1');

      expect(markdown).toContain('## Backend API (est: 13)');
    });

    it('should include epic without estimate', async () => {
      prisma.session.findUnique.mockResolvedValue({
        id: 'session-1',
        name: 'Test',
        slug: 'test',
        createdAt: new Date(),
        updatedAt: new Date(),
        participants: [],
        epics: [
          {
            id: 'epic-1',
            title: 'Frontend',
            estimatePoints: null,
            description: null,
            stories: [],
          },
        ],
      });

      const markdown = await service.generateMarkdown('session-1');

      expect(markdown).toContain('## Frontend (no estimate)');
    });

    it('should include nested story and task', async () => {
      prisma.session.findUnique.mockResolvedValue({
        id: 'session-1',
        name: 'Test',
        slug: 'test',
        createdAt: new Date(),
        updatedAt: new Date(),
        participants: [],
        epics: [
          {
            id: 'epic-1',
            title: 'API',
            estimatePoints: null,
            description: null,
            stories: [
              {
                id: 'story-1',
                title: 'User Auth',
                estimatePoints: 5,
                description: 'Authentication system',
                tasks: [
                  {
                    id: 'task-1',
                    title: 'Login endpoint',
                    estimatePoints: 3,
                    description: null,
                  },
                ],
              },
            ],
          },
        ],
      });

      const markdown = await service.generateMarkdown('session-1');

      expect(markdown).toContain('### User Auth (est: 5)');
      expect(markdown).toContain('- **Login endpoint** (est: 3)');
      expect(markdown).toContain('Authentication system');
    });

    it('should escape special markdown characters', async () => {
      prisma.session.findUnique.mockResolvedValue({
        id: 'session-1',
        name: 'Test *bold*',
        slug: 'test',
        createdAt: new Date(),
        updatedAt: new Date(),
        participants: [],
        epics: [
          {
            id: 'epic-1',
            title: 'API [docs]',
            estimatePoints: null,
            description: null,
            stories: [],
          },
        ],
      });

      const markdown = await service.generateMarkdown('session-1');

      expect(markdown).toContain('Test \\*bold\\*');
      expect(markdown).toContain('API \\[docs\\]');
    });

    it('should handle missing session', async () => {
      prisma.session.findUnique.mockResolvedValue(null);

      await expect(service.generateMarkdown('nonexistent')).rejects.toThrow();
    });

    it('should format duration correctly', async () => {
      const createdAt = new Date('2026-07-24T10:00:00Z');
      const updatedAt = new Date('2026-07-24T11:30:45Z');

      prisma.session.findUnique.mockResolvedValue({
        id: 'session-1',
        name: 'Test',
        slug: 'test',
        createdAt,
        updatedAt,
        participants: [],
        epics: [],
      });

      const markdown = await service.generateMarkdown('session-1');

      expect(markdown).toContain('1h 30m');
    });

    it('should format multiple epics with proper hierarchy', async () => {
      prisma.session.findUnique.mockResolvedValue({
        id: 'session-1',
        name: 'Test',
        slug: 'test',
        createdAt: new Date(),
        updatedAt: new Date(),
        participants: [],
        epics: [
          {
            id: 'epic-1',
            title: 'Backend',
            estimatePoints: null,
            description: null,
            stories: [
              {
                id: 'story-1',
                title: 'Auth',
                estimatePoints: 5,
                description: null,
                tasks: [],
              },
            ],
          },
          {
            id: 'epic-2',
            title: 'Frontend',
            estimatePoints: null,
            description: null,
            stories: [],
          },
        ],
      });

      const markdown = await service.generateMarkdown('session-1');

      expect(markdown).toContain('## Backend');
      expect(markdown).toContain('### Auth');
      expect(markdown).toContain('## Frontend');
    });
  });
});
