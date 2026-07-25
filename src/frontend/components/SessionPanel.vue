<template>
  <div class="session-panel">
    <div class="session-forms">
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
  gap: 2rem;
}

.session-forms {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.create-session-form,
.join-session-form {
  padding: 1.5rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

input {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

input:focus {
  outline: none;
  border-color: #4a90e2;
  box-shadow: 0 0 4px rgba(74, 144, 226, 0.2);
}

button {
  padding: 0.75rem 1rem;
  background-color: #4a90e2;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

button:hover:not(:disabled) {
  background-color: #357abd;
}

button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.btn-leave {
  background-color: #e74c3c;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
}

.btn-leave:hover {
  background-color: #c0392b;
}

.error-message {
  padding: 1rem;
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.session-info {
  padding: 1.5rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.participants {
  margin-top: 1.5rem;
}

.participants ul {
  list-style: none;
  padding: 0;
}

.participant-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background-color: #f5f5f5;
  border-radius: 4px;
  margin-bottom: 0.5rem;
}

h2 {
  margin-bottom: 1rem;
  color: #333;
}

h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: #555;
}

@media (max-width: 768px) {
  .session-forms {
    grid-template-columns: 1fr;
  }
}
</style>
