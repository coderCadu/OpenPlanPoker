import type { Socket } from 'socket.io-client'
import type { useSessionStore } from '../stores/sessionStore'
import { getVotes } from './client'

type Store = ReturnType<typeof useSessionStore>

export function registerSocketListeners(socket: Socket, store: Store): void {
  socket.on('participant:joined', (data: { pseudonym: string; participantId?: string; timestamp: string }) => {
    store.addParticipant({
      id: data.participantId || data.pseudonym,
      pseudonym: data.pseudonym,
      joinedAt: new Date(data.timestamp),
    })
  })

  socket.on('participant:left', (data: { pseudonym: string }) => {
    store.removeParticipant(data.pseudonym)
  })

  const handleIncomingMessage = (data: { pseudonym: string; content: string; timestamp: string }) => {
    store.addMessage({
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      participantName: data.pseudonym,
      text: data.content,
      timestamp: new Date(data.timestamp),
    })
  }
  socket.on('message:received', handleIncomingMessage)
  socket.on('message:sent:self', handleIncomingMessage)

  socket.on('votes:revealed', async (data: { taskId: string }) => {
    try {
      const taskVotes = await getVotes(data.taskId)
      store.setVotesForTask(
        data.taskId,
        taskVotes.map(v => {
          const known =
            store.currentUser?.id === v.participantId
              ? store.currentUser.pseudonym
              : store.participants.find(p => p.id === v.participantId)?.pseudonym
          return {
            id: v.id,
            taskId: v.taskId,
            participantId: v.participantId,
            participantName: known || v.participantId,
            card: v.card as any,
            timestamp: new Date(v.createdAt),
          }
        })
      )
      store.markTaskRevealed(data.taskId)
    } catch {
      // Non-fatal: the client who triggered reveal already has the data locally.
    }
  })
}
