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
      </div>

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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useSessionStore } from '../stores/sessionStore'

const store = useSessionStore()
const fibonacciCards = ['1', '2', '3', '5', '8', '13', '21', '?', '☕']
const myVote = ref<string | null>(null)
const allVotesRevealed = ref(false)
const finalEstimate = ref('')

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

const currentVotes = computed(() => {
  if (!currentTask.value) return []
  return store.getVotesByTask(currentTask.value.id)
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
  myVote.value = card
  store.addVote({
    id: `vote-${Date.now()}`,
    taskId: currentTask.value.id,
    participantId: store.currentUser.id,
    participantName: store.currentUser.pseudonym,
    card: card as any,
    timestamp: new Date()
  })
}

const clearVote = () => {
  myVote.value = null
}

const revealVotes = () => {
  allVotesRevealed.value = true
}

const confirmEstimate = () => {
  if (!currentTask.value || !finalEstimate.value) return
  currentTask.value.estimate = Number(finalEstimate.value)
  myVote.value = null
  allVotesRevealed.value = false
  finalEstimate.value = ''
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
