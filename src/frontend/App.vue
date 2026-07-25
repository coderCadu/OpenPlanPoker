<template>
  <div id="app" class="app">
    <header class="app-header">
      <h1>Planning Poker</h1>
      <p v-if="store.activeSession" class="session-name">{{ store.activeSession.name }}</p>
    </header>

    <main class="app-main">
      <div v-if="!store.activeSession" class="app-landing">
        <SessionPanel />
      </div>

      <div v-else class="container">
        <div class="content">
          <nav class="tabs">
            <button
              type="button"
              :class="['tab', { active: activeTab === 'voting' }]"
              @click="activeTab = 'voting'"
            >
              Voting
            </button>
            <button
              type="button"
              :class="['tab', { active: activeTab === 'stories' }]"
              @click="activeTab = 'stories'"
            >
              Stories
            </button>
          </nav>

          <VotingPanel v-if="activeTab === 'voting'" />
          <StoryPanel v-else />
        </div>

        <aside class="sidebar">
          <SessionPanel />
        </aside>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useSessionStore } from './stores/sessionStore'
import SessionPanel from './components/SessionPanel.vue'
import StoryPanel from './components/StoryPanel.vue'
import VotingPanel from './components/VotingPanel.vue'

const store = useSessionStore()
const activeTab = ref<'voting' | 'stories'>('voting')
</script>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background-color: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
  padding: var(--space-lg) var(--space-xl);
  display: flex;
  align-items: baseline;
  gap: var(--space-md);
}

.app-header h1 {
  margin: 0;
  color: var(--text-primary);
}

.session-name {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.app-main {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.app-landing {
  flex: 1;
  display: flex;
  align-items: center;
  padding: var(--space-2xl);
}

.container {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: var(--space-2xl);
  padding: var(--space-xl);
  flex: 1;
  align-items: start;
}

.content {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  min-width: 0;
}

.tabs {
  display: flex;
  gap: var(--space-sm);
}

.tab {
  padding: var(--space-sm) var(--space-lg);
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text-secondary);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s var(--ease-smooth);
}

.tab:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.tab.active {
  background: linear-gradient(135deg, var(--accent-dark), var(--accent));
  border-color: transparent;
  color: var(--bg-primary);
}

.sidebar {
  min-width: 0;
}

@media (max-width: 1024px) {
  .container {
    grid-template-columns: 1fr;
  }
}
</style>
