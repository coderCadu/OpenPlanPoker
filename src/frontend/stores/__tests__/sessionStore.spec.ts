import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSessionStore } from '../sessionStore'

describe('SessionStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('initial state', () => {
    it('should have empty session state on init', () => {
      const store = useSessionStore()
      expect(store.session).toBeNull()
    })

    it('should have empty participants list on init', () => {
      const store = useSessionStore()
      expect(store.participants).toEqual([])
    })

    it('should have empty stories hierarchy on init', () => {
      const store = useSessionStore()
      expect(store.stories).toEqual([])
    })

    it('should have empty votes on init', () => {
      const store = useSessionStore()
      expect(store.votes).toEqual([])
    })

    it('should have empty chat messages on init', () => {
      const store = useSessionStore()
      expect(store.chatMessages).toEqual([])
    })

    it('should have null current user on init', () => {
      const store = useSessionStore()
      expect(store.currentUser).toBeNull()
    })
  })

  describe('mutations', () => {
    it('should set session data', () => {
      const store = useSessionStore()
      const sessionData = {
        id: '123',
        slug: 'test-session',
        name: 'Test Session',
        status: 'active' as const,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      store.setSession(sessionData)
      expect(store.session).toEqual(sessionData)
    })

    it('should add participant', () => {
      const store = useSessionStore()
      const participant = {
        id: '1',
        pseudonym: 'Alice',
        joinedAt: new Date()
      }
      store.addParticipant(participant)
      expect(store.participants).toContainEqual(expect.objectContaining({
        id: '1',
        pseudonym: 'Alice'
      }))
      expect(store.participants.length).toBe(1)
    })

    it('should remove participant by pseudonym', () => {
      const store = useSessionStore()
      store.addParticipant({ id: '1', pseudonym: 'Alice', joinedAt: new Date() })
      store.addParticipant({ id: '2', pseudonym: 'Bob', joinedAt: new Date() })
      store.removeParticipant('Alice')
      expect(store.participants.length).toBe(1)
      expect(store.participants[0].pseudonym).toBe('Bob')
    })

    it('should set current user', () => {
      const store = useSessionStore()
      const user = { id: '1', pseudonym: 'Alice' }
      store.setCurrentUser(user)
      expect(store.currentUser).toEqual(user)
    })

    it('should add vote', () => {
      const store = useSessionStore()
      const vote = {
        id: '1',
        taskId: 'task1',
        participantId: '1',
        participantName: 'Alice',
        card: '5' as const,
        timestamp: new Date()
      }
      store.addVote(vote)
      expect(store.votes).toContainEqual(expect.objectContaining({
        id: '1',
        taskId: 'task1',
        card: '5'
      }))
    })

    it('should add chat message', () => {
      const store = useSessionStore()
      const message = {
        id: '1',
        participantName: 'Alice',
        text: 'Hello',
        timestamp: new Date()
      }
      store.addMessage(message)
      expect(store.chatMessages).toContainEqual(expect.objectContaining({
        id: '1',
        participantName: 'Alice',
        text: 'Hello'
      }))
    })

    it('should clear session data', () => {
      const store = useSessionStore()
      store.setSession({
        id: '123',
        slug: 'test',
        name: 'Test',
        status: 'active' as const,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      store.addParticipant({ id: '1', pseudonym: 'Alice', joinedAt: new Date() })
      store.clearSession()
      expect(store.session).toBeNull()
      expect(store.participants).toEqual([])
      expect(store.votes).toEqual([])
      expect(store.chatMessages).toEqual([])
    })
  })

  describe('computed getters', () => {
    it('should return active session status', () => {
      const store = useSessionStore()
      expect(store.activeSession).toBeNull()
      store.setSession({
        id: '123',
        slug: 'test',
        name: 'Test',
        status: 'active' as const,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      expect(store.activeSession).not.toBeNull()
      expect(store.activeSession?.slug).toBe('test')
    })

    it('should return participant count', () => {
      const store = useSessionStore()
      store.addParticipant({ id: '1', pseudonym: 'Alice', joinedAt: new Date() })
      store.addParticipant({ id: '2', pseudonym: 'Bob', joinedAt: new Date() })
      expect(store.participantCount).toBe(2)
    })

    it('should return votes by task', () => {
      const store = useSessionStore()
      store.addVote({
        id: '1',
        taskId: 'task1',
        participantId: '1',
        participantName: 'Alice',
        card: '5' as const,
        timestamp: new Date()
      })
      store.addVote({
        id: '2',
        taskId: 'task1',
        participantId: '2',
        participantName: 'Bob',
        card: '8' as const,
        timestamp: new Date()
      })
      const taskVotes = store.getVotesByTask('task1')
      expect(taskVotes.length).toBe(2)
    })
  })
})
