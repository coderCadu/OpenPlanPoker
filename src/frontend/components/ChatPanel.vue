<template>
  <div class="chat-panel">
    <h3>Chat</h3>

    <div ref="messageList" class="chat-messages">
      <p v-if="store.chatMessages.length === 0" class="no-messages">No messages yet</p>
      <div v-for="message in store.chatMessages" :key="message.id" class="chat-message">
        <span class="chat-author">{{ message.participantName }}</span>
        <span class="chat-text">{{ message.text }}</span>
        <span class="chat-time">{{ formatTime(message.timestamp) }}</span>
      </div>
    </div>

    <form class="chat-form" @submit.prevent="sendMessage">
      <input
        v-model="messageText"
        type="text"
        placeholder="Type a message..."
        maxlength="500"
      />
      <button type="submit" :disabled="!messageText.trim()">Send</button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, watch } from 'vue'
import { useSessionStore } from '../stores/sessionStore'
import { getSocket } from '../api/socket'

const store = useSessionStore()
const messageText = ref('')
const messageList = ref<HTMLElement>()

const formatTime = (date: Date): string => {
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const sendMessage = () => {
  const content = messageText.value.trim()
  if (!content) return
  getSocket()?.emit('chat:send', { content })
  messageText.value = ''
}

watch(
  () => store.chatMessages.length,
  async () => {
    await nextTick()
    if (messageList.value) {
      messageList.value.scrollTop = messageList.value.scrollHeight
    }
  }
)
</script>

<style scoped>
.chat-panel {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: var(--space-xl);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.chat-messages {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  max-height: 320px;
  min-height: 120px;
  overflow-y: auto;
}

.no-messages {
  color: var(--text-muted);
  font-style: italic;
}

.chat-message {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--space-xs);
  padding: var(--space-sm);
  background: var(--bg-tertiary);
  border-radius: 6px;
  animation: slideIn 0.3s var(--ease-smooth);
}

.chat-author {
  font-weight: 600;
  color: var(--accent-light);
}

.chat-text {
  color: var(--text-primary);
  flex: 1;
  word-break: break-word;
}

.chat-time {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.chat-form {
  display: flex;
  gap: var(--space-sm);
}

.chat-form input {
  flex: 1;
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  color: var(--text-primary);
  font-size: 0.875rem;
}

.chat-form input::placeholder {
  color: var(--text-muted);
}

.chat-form input:focus {
  outline: none;
  border-color: var(--accent);
}

.chat-form button {
  background: linear-gradient(135deg, var(--accent-dark), var(--accent));
  border: none;
  color: var(--bg-primary);
  padding: 0.5rem 1.25rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.chat-form button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(212, 165, 116, 0.2);
}

.chat-form button:disabled {
  background: var(--bg-tertiary);
  color: var(--text-muted);
  cursor: not-allowed;
}
</style>
