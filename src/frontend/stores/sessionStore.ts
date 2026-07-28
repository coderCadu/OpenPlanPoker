import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface Participant {
  id: string
  pseudonym: string
  joinedAt: Date
}

export interface Vote {
  id: string
  taskId: string
  participantId: string
  participantName: string
  card: '1' | '2' | '3' | '5' | '8' | '13' | '21' | '?' | '☕'
  timestamp: Date
}

export interface ChatMessage {
  id: string
  participantName: string
  text: string
  timestamp: Date
}

export interface Epic {
  id: string
  title: string
  description?: string
  stories: Story[]
}

export interface Story {
  id: string
  title: string
  description?: string
  estimate?: number
  tasks: Task[]
}

export interface Task {
  id: string
  title: string
  description?: string
  estimate?: number
}

export interface Session {
  id: string
  slug: string
  name: string
  status: 'active' | 'archived'
  createdAt: Date
  updatedAt: Date
}

export interface CurrentUser {
  id: string
  pseudonym: string
}

export const useSessionStore = defineStore('session', () => {
  const session = ref<Session | null>(null)
  const participants = ref<Participant[]>([])
  const stories = ref<Epic[]>([])
  const votes = ref<Vote[]>([])
  const chatMessages = ref<ChatMessage[]>([])
  const currentUser = ref<CurrentUser | null>(null)
  const revealedTaskIds = ref<Set<string>>(new Set())

  const setSession = (newSession: Session) => {
    session.value = newSession
  }

  const addParticipant = (participant: Participant) => {
    if (!participants.value.find(p => p.pseudonym === participant.pseudonym)) {
      participants.value.push(participant)
    }
  }

  const removeParticipant = (pseudonym: string) => {
    participants.value = participants.value.filter(p => p.pseudonym !== pseudonym)
  }

  const setCurrentUser = (user: CurrentUser) => {
    currentUser.value = user
  }

  const addVote = (vote: Vote) => {
    votes.value.push(vote)
  }

  const addMessage = (message: ChatMessage) => {
    chatMessages.value.push(message)
  }

  const addStory = (epic: Epic) => {
    stories.value.push(epic)
  }

  const setVotesForTask = (taskId: string, taskVotes: Vote[]) => {
    votes.value = votes.value.filter(v => v.taskId !== taskId).concat(taskVotes)
  }

  const markTaskRevealed = (taskId: string) => {
    revealedTaskIds.value.add(taskId)
  }

  const isTaskRevealed = (taskId: string) => {
    return revealedTaskIds.value.has(taskId)
  }

  const clearSession = () => {
    session.value = null
    participants.value = []
    stories.value = []
    votes.value = []
    chatMessages.value = []
    currentUser.value = null
    revealedTaskIds.value = new Set()
  }

  const activeSession = computed(() => session.value)

  const participantCount = computed(() => participants.value.length)

  const getVotesByTask = (taskId: string) => {
    return votes.value.filter(v => v.taskId === taskId)
  }

  const unestimatedTasks = computed(() => {
    const allTasks: Task[] = []
    stories.value.forEach(epic => {
      epic.stories.forEach(story => {
        story.tasks.forEach(task => {
          if (!task.estimate) {
            allTasks.push(task)
          }
        })
      })
    })
    return allTasks
  })

  const votedByMe = computed(() => {
    if (!currentUser.value) return []
    return votes.value.filter(v => v.participantId === currentUser.value?.id)
  })

  return {
    session,
    participants,
    stories,
    votes,
    chatMessages,
    currentUser,
    revealedTaskIds,
    setSession,
    addParticipant,
    removeParticipant,
    setCurrentUser,
    addVote,
    addMessage,
    addStory,
    setVotesForTask,
    markTaskRevealed,
    isTaskRevealed,
    clearSession,
    activeSession,
    participantCount,
    getVotesByTask,
    unestimatedTasks,
    votedByMe
  }
})
