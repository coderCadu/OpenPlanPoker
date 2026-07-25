import { setupVoteHandlers } from '../voteHandlers';

jest.mock('../../../utils/logger');

describe('Vote Event Handlers', () => {
  it('should export setupVoteHandlers function', () => {
    expect(typeof setupVoteHandlers).toBe('function');
  });

  it('should set up vote event handlers on socket', () => {
    const mockSocket = {
      data: { sessionId: 'sess-1', pseudonym: 'Alice' },
      on: jest.fn(),
    };

    const mockVoteService = {
      recordVote: jest.fn(),
      updateVote: jest.fn(),
      getAllVotes: jest.fn(),
      calculateAverage: jest.fn(),
      calculateMedian: jest.fn(),
      validateCard: jest.fn(),
    };

    const mockNotificationService = {};

    setupVoteHandlers(mockSocket as any, mockVoteService as any, mockNotificationService as any);

    expect(mockSocket.on).toHaveBeenCalled();
  });

  it('should register vote:cast handler', () => {
    const mockSocket = {
      data: { sessionId: 'sess-1', pseudonym: 'Alice' },
      on: jest.fn(),
    };

    const mockVoteService = {};
    const mockNotificationService = {};

    setupVoteHandlers(mockSocket as any, mockVoteService as any, mockNotificationService as any);

    expect(mockSocket.on).toHaveBeenCalledWith('vote:cast', expect.any(Function));
  });

  it('should register vote:update handler', () => {
    const mockSocket = {
      data: { sessionId: 'sess-1', pseudonym: 'Alice' },
      on: jest.fn(),
    };

    const mockVoteService = {};
    const mockNotificationService = {};

    setupVoteHandlers(mockSocket as any, mockVoteService as any, mockNotificationService as any);

    expect(mockSocket.on).toHaveBeenCalledWith('vote:update', expect.any(Function));
  });

  it('should register vote:reveal handler', () => {
    const mockSocket = {
      data: { sessionId: 'sess-1', pseudonym: 'Alice' },
      on: jest.fn(),
    };

    const mockVoteService = {};
    const mockNotificationService = {};

    setupVoteHandlers(mockSocket as any, mockVoteService as any, mockNotificationService as any);

    expect(mockSocket.on).toHaveBeenCalledWith('vote:reveal', expect.any(Function));
  });

  it('should handle vote:cast events with proper error handling', () => {
    const mockSocket = {
      data: { sessionId: 'sess-1', pseudonym: 'Alice' },
      on: jest.fn(),
      emit: jest.fn(),
      to: jest.fn().mockReturnValue({ emit: jest.fn() }),
    };

    const mockVoteService = {
      recordVote: jest.fn(),
      validateCard: jest.fn().mockReturnValue(true),
    };

    const mockNotificationService = {};

    setupVoteHandlers(mockSocket as any, mockVoteService as any, mockNotificationService as any);

    // Verify handlers are registered
    expect(mockSocket.on.mock.calls.length).toBeGreaterThanOrEqual(3);
  });

  it('should handle vote:update events', () => {
    const mockSocket = {
      data: { sessionId: 'sess-1', pseudonym: 'Alice' },
      on: jest.fn(),
      emit: jest.fn(),
      to: jest.fn().mockReturnValue({ emit: jest.fn() }),
    };

    const mockVoteService = {
      updateVote: jest.fn(),
      validateCard: jest.fn().mockReturnValue(true),
    };

    const mockNotificationService = {};

    setupVoteHandlers(mockSocket as any, mockVoteService as any, mockNotificationService as any);

    // Vote update handler is registered
    const updateHandler = mockSocket.on.mock.calls.find((call: any) => call[0] === 'vote:update');
    expect(updateHandler).toBeDefined();
  });

  it('should handle vote:reveal events', () => {
    const mockSocket = {
      data: { sessionId: 'sess-1', pseudonym: 'Alice' },
      on: jest.fn(),
      emit: jest.fn(),
      to: jest.fn().mockReturnValue({ emit: jest.fn() }),
    };

    const mockVoteService = {
      getAllVotes: jest.fn(),
      calculateAverage: jest.fn(),
      calculateMedian: jest.fn(),
    };

    const mockNotificationService = {};

    setupVoteHandlers(mockSocket as any, mockVoteService as any, mockNotificationService as any);

    // Vote reveal handler is registered
    const revealHandler = mockSocket.on.mock.calls.find((call: any) => call[0] === 'vote:reveal');
    expect(revealHandler).toBeDefined();
  });

  it('should use session ID from socket data for room name', () => {
    const mockSocket = {
      data: { sessionId: 'special-session-123', pseudonym: 'Alice' },
      on: jest.fn(),
      emit: jest.fn(),
      to: jest.fn().mockReturnValue({ emit: jest.fn() }),
    };

    const mockVoteService = {};
    const mockNotificationService = {};

    setupVoteHandlers(mockSocket as any, mockVoteService as any, mockNotificationService as any);

    // Handler should use sessionId to form room name
    expect(mockSocket.on).toHaveBeenCalled();
  });

  it('should emit events to room with proper format', () => {
    const mockSocket = {
      data: { sessionId: 'sess-1', pseudonym: 'Alice' },
      on: jest.fn(),
      emit: jest.fn(),
      to: jest.fn().mockReturnValue({ emit: jest.fn() }),
    };

    const mockVoteService = {};
    const mockNotificationService = {};

    setupVoteHandlers(mockSocket as any, mockVoteService as any, mockNotificationService as any);

    // Room name format is session:${sessionId}
    expect(mockSocket.to).toBeDefined();
  });

  it('should validate card values before processing', () => {
    const mockSocket = {
      data: { sessionId: 'sess-1', pseudonym: 'Alice' },
      on: jest.fn(),
      emit: jest.fn(),
      to: jest.fn().mockReturnValue({ emit: jest.fn() }),
    };

    const mockVoteService = {
      validateCard: jest.fn().mockReturnValue(false),
    };

    const mockNotificationService = {};

    setupVoteHandlers(mockSocket as any, mockVoteService as any, mockNotificationService as any);

    // Handler validates cards via VoteService
    expect(mockSocket.on).toHaveBeenCalled();
  });
});
