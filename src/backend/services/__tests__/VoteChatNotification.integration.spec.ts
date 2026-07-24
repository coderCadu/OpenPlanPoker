import { VoteService } from '../VoteService';
import { ChatService } from '../ChatService';
import { NotificationService } from '../NotificationService';

// Mock Prisma
jest.mock('../../config/database', () => ({
  prisma: {
    vote: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    message: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

const { prisma } = require('../../config/database');

describe('Vote, Chat, and Notification Integration', () => {
  let voteService: VoteService;
  let chatService: ChatService;
  let notificationService: NotificationService;
  let mockIO: any;
  let mockRoom: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup services
    mockRoom = {
      emit: jest.fn().mockReturnThis(),
    };

    mockIO = {
      to: jest.fn().mockReturnValue(mockRoom),
    };

    voteService = new VoteService();
    chatService = new ChatService();
    notificationService = new NotificationService(mockIO);
  });

  describe('Complete voting and chat flow', () => {
    it('should handle voting, calculation, and chat messaging', async () => {
      const mockPrisma = prisma as jest.Mocked<typeof prisma>;

      // Setup: Create votes
      const votes = [
        {
          id: 'vote-1',
          taskId: 'task-1',
          participantId: 'p1',
          sessionId: 'session-1',
          card: '5',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'vote-2',
          taskId: 'task-1',
          participantId: 'p2',
          sessionId: 'session-1',
          card: '8',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'vote-3',
          taskId: 'task-1',
          participantId: 'p3',
          sessionId: 'session-1',
          card: '3',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      // Record votes
      mockPrisma.vote.findUnique = jest.fn().mockResolvedValue(null);
      mockPrisma.vote.create = jest.fn().mockImplementation((args) =>
        Promise.resolve({
          ...args.data,
          id: `vote-${Math.random()}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      );

      for (const vote of votes) {
        await voteService.recordVote(
          vote.taskId,
          vote.participantId,
          vote.sessionId,
          vote.card
        );
      }

      // Calculate statistics
      const average = voteService.calculateAverage(votes);
      const median = voteService.calculateMedian(votes);

      expect(average).toBe((5 + 8 + 3) / 3); // 5.33
      expect(median).toBe(5);

      // Broadcast votes revealed
      notificationService.broadcastVotesRevealed('session-1', 'task-1', average, median);

      expect(mockIO.to).toHaveBeenCalledWith('session:session-1');
      expect(mockRoom.emit).toHaveBeenCalledWith(
        'votes:revealed',
        expect.objectContaining({
          taskId: 'task-1',
          average: expect.closeTo(5.33, 2),
          median: 5,
        })
      );
    });

    it('should broadcast voting and then chat message', async () => {
      const mockPrisma = prisma as jest.Mocked<typeof prisma>;

      // Broadcast voting started
      notificationService.broadcastVotingStarted('session-1', 'task-1', 'Estimate API');

      expect(mockRoom.emit).toHaveBeenCalledWith(
        'voting:started',
        expect.objectContaining({
          taskId: 'task-1',
          taskTitle: 'Estimate API',
        })
      );

      // Save a message
      mockPrisma.message.create = jest.fn().mockResolvedValue({
        id: 'msg-1',
        sessionId: 'session-1',
        participantId: 'p1',
        content: 'This looks like 8 points',
        createdAt: new Date(),
      });

      const message = await chatService.saveMessage(
        'session-1',
        'p1',
        'This looks like 8 points'
      );

      expect(message.content).toBe('This looks like 8 points');

      // Broadcast message
      notificationService.broadcastMessageSent(
        'session-1',
        message.participantId,
        'Alice',
        message.content
      );

      const messageBroadcast = mockRoom.emit.mock.calls.find(
        (call) => call[0] === 'message:sent'
      );
      expect(messageBroadcast).toBeDefined();
      expect(messageBroadcast[1]).toEqual(
        expect.objectContaining({
          pseudonym: 'Alice',
          content: 'This looks like 8 points',
        })
      );
    });

    it('should handle participant join and voting flow', async () => {
      // Broadcast participant joined
      notificationService.broadcastParticipantJoined('session-1', 'Alice');

      expect(mockRoom.emit).toHaveBeenCalledWith(
        'participant:joined',
        expect.objectContaining({
          pseudonym: 'Alice',
        })
      );

      // Simulate voting with special cards
      const votes = [
        { id: 'v1', taskId: 't1', participantId: 'p1', sessionId: 's1', card: '?', createdAt: new Date(), updatedAt: new Date() },
        { id: 'v2', taskId: 't1', participantId: 'p2', sessionId: 's1', card: '5', createdAt: new Date(), updatedAt: new Date() },
        { id: 'v3', taskId: 't1', participantId: 'p3', sessionId: 's1', card: '☕', createdAt: new Date(), updatedAt: new Date() },
        { id: 'v4', taskId: 't1', participantId: 'p4', sessionId: 's1', card: '8', createdAt: new Date(), updatedAt: new Date() },
      ];

      const average = voteService.calculateAverage(votes);
      const median = voteService.calculateMedian(votes);

      // Average and median should ignore '?' and '☕'
      expect(average).toBe((5 + 8) / 2); // 6.5
      expect(median).toBe((5 + 8) / 2); // 6.5

      notificationService.broadcastVotesRevealed('session-1', 't1', average, median);

      const votesRevealedCall = mockRoom.emit.mock.calls.find(
        (call) => call[0] === 'votes:revealed'
      );
      expect(votesRevealedCall[1]).toEqual(
        expect.objectContaining({
          average: 6.5,
          median: 6.5,
        })
      );
    });

    it('should broadcast session closed after voting and chat', async () => {
      const mockPrisma = prisma as jest.Mocked<typeof prisma>;

      // Vote on a task
      mockPrisma.vote.findUnique = jest.fn().mockResolvedValue(null);
      mockPrisma.vote.create = jest.fn().mockResolvedValue({
        id: 'vote-1',
        taskId: 'task-1',
        participantId: 'p1',
        sessionId: 'session-1',
        card: '5',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await voteService.recordVote('task-1', 'p1', 'session-1', '5');

      // Send a message
      mockPrisma.message.create = jest.fn().mockResolvedValue({
        id: 'msg-1',
        sessionId: 'session-1',
        participantId: 'p1',
        content: 'Great discussion!',
        createdAt: new Date(),
      });

      await chatService.saveMessage('session-1', 'p1', 'Great discussion!');

      // Broadcast session closed
      notificationService.broadcastSessionClosed('session-1');

      expect(mockIO.to).toHaveBeenCalledWith('session:session-1');
      const closedCall = mockRoom.emit.mock.calls.find((call) => call[0] === 'session:closed');
      expect(closedCall).toBeDefined();
    });

    it('should handle message truncation in notification flow', async () => {
      const mockPrisma = prisma as jest.Mocked<typeof prisma>;

      // Create a long message that will be truncated
      const longContent = 'a'.repeat(600);

      mockPrisma.message.create = jest.fn().mockImplementation((args) =>
        Promise.resolve({
          id: 'msg-1',
          sessionId: args.data.sessionId,
          participantId: args.data.participantId,
          content: args.data.content, // Already truncated by service
          createdAt: new Date(),
        })
      );

      const savedMessage = await chatService.saveMessage('session-1', 'p1', longContent);

      expect(savedMessage.content).toHaveLength(500);

      // Broadcast the truncated message
      notificationService.broadcastMessageSent(
        'session-1',
        savedMessage.participantId,
        'User',
        savedMessage.content
      );

      const messageBroadcast = mockRoom.emit.mock.calls.find(
        (call) => call[0] === 'message:sent'
      );
      expect(messageBroadcast[1].content).toHaveLength(500);
    });
  });

  describe('Multiple votes with different card types', () => {
    it('should calculate statistics correctly with mixed card types', () => {
      const votes = [
        { id: 'v1', taskId: 't1', participantId: 'p1', sessionId: 's1', card: '1', createdAt: new Date(), updatedAt: new Date() },
        { id: 'v2', taskId: 't1', participantId: 'p2', sessionId: 's1', card: '2', createdAt: new Date(), updatedAt: new Date() },
        { id: 'v3', taskId: 't1', participantId: 'p3', sessionId: 's1', card: '3', createdAt: new Date(), updatedAt: new Date() },
        { id: 'v4', taskId: 't1', participantId: 'p4', sessionId: 's1', card: '5', createdAt: new Date(), updatedAt: new Date() },
        { id: 'v5', taskId: 't1', participantId: 'p5', sessionId: 's1', card: '8', createdAt: new Date(), updatedAt: new Date() },
        { id: 'v6', taskId: 't1', participantId: 'p6', sessionId: 's1', card: '?', createdAt: new Date(), updatedAt: new Date() },
      ];

      const average = voteService.calculateAverage(votes);
      const median = voteService.calculateMedian(votes);

      // (1+2+3+5+8)/5 = 19/5 = 3.8
      expect(average).toBe(3.8);
      // [1,2,3,5,8] middle = 3
      expect(median).toBe(3);
    });
  });
});
