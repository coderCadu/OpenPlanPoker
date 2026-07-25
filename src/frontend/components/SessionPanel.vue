<template>
  <div class="session-panel">
    <div v-if="!store.activeSession" class="session-forms">
      <div class="create-session-form">
        <h2>Create Session</h2>
        <form @submit.prevent="createSession">
          <input
            v-model="createForm.name"
            type="text"
            placeholder="Session name"
            required
          />
          <input
            v-model="createForm.description"
            type="text"
            placeholder="Description (optional)"
          />
          <input
            v-model="createForm.pseudonym"
            type="text"
            placeholder="Your pseudonym"
            required
          />
          <button type="submit" :disabled="!createForm.name || !createForm.pseudonym">
            Create
          </button>
        </form>
      </div>

      <div class="join-session-form">
        <h2>Join Session</h2>
        <form @submit.prevent="joinSession">
          <input
            v-model="joinForm.slug"
            type="text"
            placeholder="Session slug"
            required
          />
          <input
            v-model="joinForm.pseudonym"
            type="text"
            placeholder="Your pseudonym"
            required
          />
          <button type="submit" :disabled="!joinForm.slug || !joinForm.pseudonym">
            Join
          </button>
        </form>
      </div>
    </div>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <div v-if="store.activeSession" class="session-info">
      <h2>{{ store.activeSession.name }}</h2>
      <p>Session: {{ store.activeSession.slug }}</p>

      <div class="participants">
        <h3>Participants</h3>
        <ul>
          <li v-for="participant in store.participants" :key="participant.id" class="participant-item">
            <span>{{ participant.pseudonym }}</span>
            <button @click="leaveSession(participant.pseudonym)" class="btn-leave">
              Leave
            </button>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useSessionStore } from '../stores/sessionStore'

const store = useSessionStore()
const error = ref<string>('')

const createForm = ref({
  name: '',
  description: '',
  pseudonym: ''
})

const joinForm = ref({
  slug: '',
  pseudonym: ''
})

const createSession = async () => {
  try {
    error.value = ''
    // TODO: Call API to create session
    // const response = await axios.post('/api/sessions', createForm.value)
    // store.setSession(response.data)
    // store.setCurrentUser({ id: response.data.id, pseudonym: createForm.value.pseudonym })
  } catch (err) {
    error.value = 'Failed to create session'
  }
}

const joinSession = async () => {
  try {
    error.value = ''
    // TODO: Call API to join session
    // const response = await axios.post(`/api/sessions/${joinForm.value.slug}/join`, {
    //   pseudonym: joinForm.value.pseudonym
    // })
  } catch (err) {
    error.value = 'Failed to join session'
  }
}

const leaveSession = async (pseudonym: string) => {
  try {
    store.removeParticipant(pseudonym)
    // TODO: Call API to leave session
  } catch (err) {
    error.value = 'Failed to leave session'
  }
}
</script>

<style scoped>
.session-panel {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
  width: 100%;
}

.session-forms {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-xl);
  max-width: 720px;
  margin: 0 auto;
}

.create-session-form,
.join-session-form {
  padding: var(--space-xl);
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 8px;
}

form {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

input {
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  color: var(--text-primary);
  font-size: 0.875rem;
  transition: border-color 0.2s;
}

input::placeholder {
  color: var(--text-muted);
}

input:focus {
  outline: none;
  border-color: var(--accent);
}

button {
  background: linear-gradient(135deg, var(--accent-dark), var(--accent));
  border: none;
  color: var(--bg-primary);
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(212, 165, 116, 0.2);
}

button:active:not(:disabled) {
  transform: translateY(0);
}

button:disabled {
  background: var(--bg-tertiary);
  color: var(--text-muted);
  cursor: not-allowed;
}

.btn-leave {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--danger);
  padding: 0.4rem 0.75rem;
  font-size: 0.875rem;
}

.btn-leave:hover:not(:disabled) {
  border-color: var(--danger);
  box-shadow: none;
  transform: none;
}

.error-message {
  padding: var(--space-md);
  background-color: rgba(224, 120, 86, 0.12);
  color: var(--danger);
  border: 1px solid var(--danger);
  border-radius: 6px;
  margin-bottom: var(--space-md);
}

.session-info {
  padding: var(--space-xl);
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 8px;
}

.session-info h2 {
  color: var(--text-primary);
}

.session-info p {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.participants {
  margin-top: var(--space-xl);
}

.participants ul {
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.participant-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-sm);
  background-color: var(--bg-tertiary);
  border-radius: 6px;
  color: var(--text-primary);
}

h2 {
  margin-bottom: var(--space-md);
  color: var(--text-primary);
}

h3 {
  margin-top: 0;
  margin-bottom: var(--space-md);
  color: var(--text-secondary);
}

@media (max-width: 768px) {
  .session-forms {
    grid-template-columns: 1fr;
  }
}
</style>
