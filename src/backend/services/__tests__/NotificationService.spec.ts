import { NotificationService } from '../NotificationService';

describe('NotificationService', () => {
  let service: NotificationService;
  let mockIO: any;
  let mockRoom: any;

  beforeEach(() => {
    // Mock Socket.io
    mockRoom = {
      emit: jest.fn().mockReturnThis(),
    };

    mockIO = {
      to: jest.fn().mockReturnValue(mockRoom),
    };

    service = new NotificationService(mockIO);
  });

  describe('broadcastParticipantJoined', () => {
    it('should emit participant:joined event to session room', () => {
      service.broadcastParticipantJoined('session-1', 'Alice');

      expect(mockIO.to).toHaveBeenCalledWith('session:session-1');
      expect(mockRoom.emit).toHaveBeenCalledWith(
        'participant:joined',
        expect.objectContaining({
          pseudonym: 'Alice',
        })
      );
    });

    it('should include timestamp in broadcast', () => {
      service.broadcastParticipantJoined('session-1', 'Bob');

      const call = mockRoom.emit.mock.calls[0];
      expect(call[1]).toHaveProperty('timestamp');
      expect(call[1].timestamp).toBeInstanceOf(Date);
    });

    it('should use correct session room format', () => {
      service.broadcastParticipantJoined('session-abc123', 'Charlie');

      expect(mockIO.to).toHaveBeenCalledWith('session:session-abc123');
    });
  });

  describe('broadcastVotingStarted', () => {
    it('should emit voting:started event to session room', () => {
      service.broadcastVotingStarted('session-1', 'task-1', 'Task Title');

      expect(mockIO.to).toHaveBeenCalledWith('session:session-1');
      expect(mockRoom.emit).toHaveBeenCalledWith(
        'voting:started',
        expect.objectContaining({
          taskId: 'task-1',
          taskTitle: 'Task Title',
        })
      );
    });

    it('should include timestamp in broadcast', () => {
      service.broadcastVotingStarted('session-1', 'task-1', 'Title');

      const call = mockRoom.emit.mock.calls[0];
      expect(call[1]).toHaveProperty('timestamp');
      expect(call[1].timestamp).toBeInstanceOf(Date);
    });

    it('should broadcast to correct session room', () => {
      service.broadcastVotingStarted('session-xyz', 'task-123', 'Estimate API');

      expect(mockIO.to).toHaveBeenCalledWith('session:session-xyz');
    });
  });

  describe('broadcastVotesRevealed', () => {
    it('should emit votes:revealed event with numeric values', () => {
      service.broadcastVotesRevealed('session-1', 'task-1', 5.5, 5);

      expect(mockIO.to).toHaveBeenCalledWith('session:session-1');
      expect(mockRoom.emit).toHaveBeenCalledWith(
        'votes:revealed',
        expect.objectContaining({
          taskId: 'task-1',
          average: 5.5,
          median: 5,
        })
      );
    });

    it('should emit votes:revealed event with null values', () => {
      service.broadcastVotesRevealed('session-1', 'task-1', null, null);

      expect(mockRoom.emit).toHaveBeenCalledWith(
        'votes:revealed',
        expect.objectContaining({
          average: null,
          median: null,
        })
      );
    });

    it('should include timestamp in broadcast', () => {
      service.broadcastVotesRevealed('session-1', 'task-1', 4.2, 5);

      const call = mockRoom.emit.mock.calls[0];
      expect(call[1]).toHaveProperty('timestamp');
      expect(call[1].timestamp).toBeInstanceOf(Date);
    });

    it('should broadcast to correct session room', () => {
      service.broadcastVotesRevealed('session-data', 'task-data', 3, 3);

      expect(mockIO.to).toHaveBeenCalledWith('session:session-data');
    });
  });

  describe('broadcastMessageSent', () => {
    it('should emit message:sent event to session room', () => {
      service.broadcastMessageSent('session-1', 'participant-1', 'Alice', 'Hello world');

      expect(mockIO.to).toHaveBeenCalledWith('session:session-1');
      expect(mockRoom.emit).toHaveBeenCalledWith(
        'message:sent',
        expect.objectContaining({
          participantId: 'participant-1',
          pseudonym: 'Alice',
          content: 'Hello world',
        })
      );
    });

    it('should include timestamp in broadcast', () => {
      service.broadcastMessageSent('session-1', 'participant-1', 'Bob', 'Test');

      const call = mockRoom.emit.mock.calls[0];
      expect(call[1]).toHaveProperty('timestamp');
      expect(call[1].timestamp).toBeInstanceOf(Date);
    });

    it('should broadcast to correct session room', () => {
      service.broadcastMessageSent('session-msg', 'part-msg', 'User', 'Content');

      expect(mockIO.to).toHaveBeenCalledWith('session:session-msg');
    });

    it('should handle long message content', () => {
      const longContent = 'a'.repeat(500);
      service.broadcastMessageSent('session-1', 'participant-1', 'Alice', longContent);

      expect(mockRoom.emit).toHaveBeenCalledWith(
        'message:sent',
        expect.objectContaining({
          content: longContent,
        })
      );
    });
  });

  describe('broadcastSessionClosed', () => {
    it('should emit session:closed event to session room', () => {
      service.broadcastSessionClosed('session-1');

      expect(mockIO.to).toHaveBeenCalledWith('session:session-1');
      expect(mockRoom.emit).toHaveBeenCalledWith('session:closed', expect.any(Object));
    });

    it('should include timestamp in broadcast', () => {
      service.broadcastSessionClosed('session-1');

      const call = mockRoom.emit.mock.calls[0];
      expect(call[1]).toHaveProperty('timestamp');
      expect(call[1].timestamp).toBeInstanceOf(Date);
    });

    it('should broadcast to correct session room', () => {
      service.broadcastSessionClosed('session-end');

      expect(mockIO.to).toHaveBeenCalledWith('session:session-end');
    });
  });

  describe('room verification', () => {
    it('should use consistent room naming convention', () => {
      service.broadcastParticipantJoined('session-1', 'Test');
      service.broadcastVotingStarted('session-1', 'task-1', 'Test');

      const firstRoomCall = mockIO.to.mock.calls[0][0];
      const secondRoomCall = mockIO.to.mock.calls[1][0];

      expect(firstRoomCall).toBe(secondRoomCall);
      expect(firstRoomCall).toMatch(/^session:/);
    });

    it('should emit to correct socket rooms for different sessions', () => {
      service.broadcastParticipantJoined('session-1', 'Test1');
      service.broadcastParticipantJoined('session-2', 'Test2');

      expect(mockIO.to).toHaveBeenNthCalledWith(1, 'session:session-1');
      expect(mockIO.to).toHaveBeenNthCalledWith(2, 'session:session-2');
    });
  });
});
