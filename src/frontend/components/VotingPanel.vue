<template>
  <div class="voting-panel">
    <div v-if="!store.activeSession" class="empty-state">
      <p>No active session. Create or join a session to start voting.</p>
    </div>

    <div v-else class="voting-container">
      <div class="task-info">
        <h2>Current Task</h2>
        <p v-if="currentTask" class="task-title">{{ currentTask.title }}</p>
        <p v-else class="no-task">No tasks available for voting</p>
      </div>

      <div v-if="currentTask" class="voting-section">
        <h3>Cast Your Vote</h3>
        <div class="fibonacci-cards">
          <button
            v-for="card in fibonacciCards"
            :key="card"
            @click="castVote(card)"
            :class="['card', { selected: myVote === card }]"
          >
            {{ card }}
          </button>
        </div>

        <div v-if="myVote" class="vote-confirmation">
          <p>Your vote: <strong>{{ myVote }}</strong></p>
          <button @click="clearVote" class="btn-clear">Change Vote</button>
        </div>

        <div v-if="!allVotesRevealed" class="reveal-section">
          <button @click="revealVotes" class="btn-confirm">Reveal Votes</button>
        </div>
      </div>

      <div v-if="error" class="error-message">{{ error }}</div>

      <div v-if="allVotesRevealed" class="results-section">
        <h3>Vote Results</h3>
        <div class="results">
          <div v-for="vote in currentVotes" :key="`${vote.participantId}`" class="vote-result">
            <span class="participant">{{ vote.participantName }}</span>
            <span class="vote-card">{{ vote.card }}</span>
          </div>
        </div>

        <div v-if="statistics" class="statistics">
          <div class="stat">
            <span>Average:</span>
            <strong>{{ statistics.average }}</strong>
          </div>
          <div class="stat">
            <span>Median:</span>
            <strong>{{ statistics.median }}</strong>
          </div>
        </div>

        <div class="confirm-section">
          <input
            v-model="finalEstimate"
            type="number"
            placeholder="Final estimate"
            class="estimate-input"
          />
          <button @click="confirmEstimate" class="btn-confirm">Confirm Estimate</button>
        </div>
      </div>

      <div class="completion-status">
        <p v-if="unestimatedCount > 0">{{ unestimatedCount }} tasks remaining</p>
        <p v-else class="all-done">All Done! ✓</p>
      </div>

      <ChatPanel />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useSessionStore } from '../stores/sessionStore'
import {
  castVote as apiCastVote,
  updateVote as apiUpdateVote,
  revealVotes as apiRevealVotes,
  confirmEstimate as apiConfirmEstimate,
} from '../api/client'
import { getSocket } from '../api/socket'
import ChatPanel from './ChatPanel.vue'

const store = useSessionStore()
const fibonacciCards = ['1', '2', '3', '5', '8', '13', '21', '?', '☕']
const myVote = ref<string | null>(null)
const myVoteId = ref<string | null>(null)
const finalEstimate = ref('')
const error = ref('')

const currentTask = computed(() => {
  for (const epic of store.stories) {
    for (const story of epic.stories) {
      for (const task of story.tasks) {
        if (!task.estimate) {
          return task
        }
      }
    }
  }
  return null
})

// Reset local voting state whenever the active task changes
watch(currentTask, (task) => {
  myVote.value = null
  myVoteId.value = null
  finalEstimate.value = ''
  if (task && store.currentUser) {
    const existing = store.votes.find(v => v.taskId === task.id && v.participantId === store.currentUser!.id)
    if (existing) {
      myVote.value = existing.card
      myVoteId.value = existing.id
    }
  }
})

const currentVotes = computed(() => {
  if (!currentTask.value) return []
  return store.getVotesByTask(currentTask.value.id)
})

const allVotesRevealed = computed(() => {
  return currentTask.value ? store.isTaskRevealed(currentTask.value.id) : false
})

const statistics = computed(() => {
  const votes = currentVotes.value
  if (votes.length === 0) return null

  const numericVotes = votes
    .map(v => v.card)
    .filter(c => !['?', '☕'].includes(c))
    .map(Number)
    .sort((a, b) => a - b)

  if (numericVotes.length === 0) return null

  const average = (numericVotes.reduce((a, b) => a + b, 0) / numericVotes.length).toFixed(2)
  const mid = Math.floor(numericVotes.length / 2)
  const median = numericVotes.length % 2 ? numericVotes[mid] : (numericVotes[mid - 1] + numericVotes[mid]) / 2

  return { average, median: median.toFixed(2) }
})

const unestimatedCount = computed(() => {
  return store.unestimatedTasks.length
})

const castVote = (card: string) => {
  if (!currentTask.value || !store.currentUser) return
  const taskId = currentTask.value.id
  const participant = store.currentUser
  myVote.value = card

  const existingIdx = store.votes.findIndex(v => v.taskId === taskId && v.participantId === participant.id)
  if (existingIdx >= 0) {
    store.votes[existingIdx].card = card as any
  } else {
    store.addVote({
      id: `vote-${Date.now()}`,
      taskId,
      participantId: participant.id,
      participantName: participant.pseudonym,
      card: card as any,
      timestamp: new Date()
    })
  }

  if (!store.activeSession) return

  if (myVoteId.value) {
    apiUpdateVote(myVoteId.value, card).catch(() => { error.value = 'Failed to update vote' })
  } else {
    apiCastVote(taskId, participant.id, store.activeSession.id, card)
      .then(vote => { myVoteId.value = vote.id })
      .catch(() => { error.value = 'Failed to cast vote' })
  }
}

const clearVote = () => {
  myVote.value = null
}

const revealVotes = async () => {
  if (!currentTask.value || !store.activeSession) return
  try {
    const result = await apiRevealVotes(currentTask.value.id, store.activeSession.id)
    store.setVotesForTask(
      currentTask.value.id,
      result.votes.map(v => ({
        id: `${currentTask.value!.id}-${v.participantId}`,
        taskId: currentTask.value!.id,
        participantId: v.participantId,
        participantName:
          store.currentUser?.id === v.participantId
            ? store.currentUser.pseudonym
            : store.participants.find(p => p.id === v.participantId)?.pseudonym || v.participantId,
        card: v.card as any,
        timestamp: new Date()
      }))
    )
    store.markTaskRevealed(currentTask.value.id)
    getSocket()?.emit('vote:reveal', { taskId: currentTask.value.id })
  } catch (err) {
    error.value = 'Failed to reveal votes'
  }
}

const confirmEstimate = async () => {
  if (!currentTask.value || !finalEstimate.value) return
  const task = currentTask.value
  try {
    await apiConfirmEstimate(task.id, Number(finalEstimate.value))
    task.estimate = Number(finalEstimate.value)
    myVote.value = null
    finalEstimate.value = ''
  } catch (err) {
    error.value = 'Failed to confirm estimate'
  }
}
</script>

<style scoped>
.voting-panel {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

.empty-state {
  padding: var(--space-2xl);
  text-align: center;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text-muted);
}

.voting-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-2xl);
}

.task-info,
.voting-section,
.results-section {
  background: var(--bg-secondary);
  padding: var(--space-xl);
  border: 1px solid var(--border);
  border-radius: 8px;
}

.task-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-top: var(--space-md);
}

.no-task {
  color: var(--text-muted);
  font-style: italic;
}

.fibonacci-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(60px, 1fr));
  gap: var(--space-sm);
  margin: var(--space-md) 0;
}

.card {
  aspect-ratio: 1 / 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--bg-secondary), var(--bg-tertiary));
  border: 2px solid var(--border);
  border-radius: 12px;
  color: var(--text-primary);
  cursor: pointer;
  font-weight: 700;
  font-size: 1.5rem;
  transition: all 0.2s var(--ease-bounce);
}

.card:hover {
  border-color: var(--accent);
  background: linear-gradient(135deg, #2a3442, #353f52);
  transform: translateY(-2px);
}

.card.selected {
  border-color: var(--accent-light);
  background: linear-gradient(135deg, var(--accent-dark), var(--accent));
  color: var(--bg-primary);
  box-shadow: 0 8px 24px rgba(212, 165, 116, 0.25);
  transform: scale(1.05) translateY(-4px);
}

.vote-confirmation {
  margin-top: var(--space-md);
  padding: var(--space-md);
  background-color: rgba(106, 185, 134, 0.12);
  border-radius: 6px;
  border: 1px solid var(--success);
  color: var(--text-primary);
}

.btn-clear {
  margin-top: var(--space-sm);
  padding: 0.5rem 1rem;
  background: transparent;
  color: var(--accent);
  border: 1px solid var(--border);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-clear:hover {
  border-color: var(--accent);
}

.reveal-section {
  margin-top: var(--space-md);
}

.error-message {
  padding: var(--space-md);
  background-color: rgba(224, 120, 86, 0.12);
  color: var(--danger);
  border: 1px solid var(--danger);
  border-radius: 6px;
}

.results {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  margin: var(--space-md) 0;
}

.vote-result {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-sm);
  background-color: var(--bg-tertiary);
  border-radius: 6px;
}

.participant {
  font-weight: 600;
  color: var(--text-primary);
}

.vote-card {
  background-color: var(--bg-secondary);
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  color: var(--accent-light);
  font-weight: 700;
}

.statistics {
  display: flex;
  gap: var(--space-2xl);
  margin: var(--space-xl) 0;
  padding: var(--space-md);
  background-color: var(--bg-tertiary);
  border-radius: 6px;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.stat span {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.stat strong {
  font-size: 1.75rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--accent-light), var(--accent));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.confirm-section {
  display: flex;
  gap: var(--space-md);
  margin-top: var(--space-md);
}

.estimate-input {
  flex: 1;
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  color: var(--text-primary);
  font-size: 0.875rem;
  transition: border-color 0.2s;
}

.estimate-input:focus {
  outline: none;
  border-color: var(--accent);
}

.btn-confirm {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, var(--accent-dark), var(--accent));
  color: var(--bg-primary);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: transform 0.2s, box-shadow 0.2s;
}

.btn-confirm:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(212, 165, 116, 0.2);
}

.completion-status {
  padding: var(--space-md);
  text-align: center;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 8px;
}

.all-done {
  color: var(--success);
  font-weight: 600;
  font-size: 1.1rem;
}

h2,
h3 {
  margin-bottom: var(--space-md);
  color: var(--text-primary);
}
</style>
