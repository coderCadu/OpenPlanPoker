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
            <span class="card">{{ vote.card }}</span>
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
  gap: 1.5rem;
}

.empty-state {
  padding: 2rem;
  text-align: center;
  background: #f5f5f5;
  border-radius: 8px;
  color: #999;
}

.voting-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.task-info {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.task-title {
  font-size: 1.25rem;
  font-weight: 500;
  color: #333;
  margin-top: 1rem;
}

.no-task {
  color: #999;
  font-style: italic;
}

.voting-section {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.fibonacci-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(60px, 1fr));
  gap: 0.75rem;
  margin: 1rem 0;
}

.card {
  padding: 1rem;
  background-color: #f0f0f0;
  border: 2px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  font-size: 1.1rem;
  transition: all 0.2s;
}

.card:hover {
  border-color: #4a90e2;
  box-shadow: 0 2px 8px rgba(74, 144, 226, 0.2);
}

.card.selected {
  background-color: #4a90e2;
  color: white;
  border-color: #357abd;
}

.vote-confirmation {
  margin-top: 1rem;
  padding: 1rem;
  background-color: #d4edda;
  border-radius: 4px;
  border: 1px solid #c3e6cb;
  color: #155724;
}

.btn-clear {
  margin-top: 0.75rem;
  padding: 0.5rem 1rem;
  background-color: #ffc107;
  color: #333;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-clear:hover {
  background-color: #e0a800;
}

.results-section {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.results {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin: 1rem 0;
}

.vote-result {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.participant {
  font-weight: 500;
}

.card {
  background-color: #e8f4f8;
  padding: 0.25rem 0.75rem;
  border-radius: 3px;
  color: #2980b9;
}

.statistics {
  display: flex;
  gap: 2rem;
  margin: 1.5rem 0;
  padding: 1rem;
  background-color: #f9f9f9;
  border-radius: 4px;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.stat span {
  font-size: 0.875rem;
  color: #666;
}

.stat strong {
  font-size: 1.5rem;
  color: #333;
}

.confirm-section {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.estimate-input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.estimate-input:focus {
  outline: none;
  border-color: #4a90e2;
  box-shadow: 0 0 4px rgba(74, 144, 226, 0.2);
}

.btn-confirm {
  padding: 0.75rem 1.5rem;
  background-color: #27ae60;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

.btn-confirm:hover {
  background-color: #229954;
}

.completion-status {
  padding: 1rem;
  text-align: center;
  background: #f9f9f9;
  border-radius: 8px;
}

.all-done {
  color: #27ae60;
  font-weight: 500;
  font-size: 1.1rem;
}

h2,
h3 {
  margin-bottom: 1rem;
  color: #333;
}
</style>
