<template>
  <div class="story-panel">
    <div class="story-controls">
      <h2>Story Hierarchy</h2>

      <div class="control-buttons">
        <button @click="showAddEpicForm = !showAddEpicForm" class="btn-primary">
          {{ showAddEpicForm ? 'Cancel' : 'Add Epic' }}
        </button>
        <button @click="triggerMarkdownImport" class="btn-secondary">
          Import Markdown
        </button>
        <input
          ref="fileInput"
          type="file"
          accept=".md"
          style="display: none"
          @change="handleMarkdownImport"
        />
      </div>

      <div v-if="showAddEpicForm" class="form-container">
        <form @submit.prevent="addEpic">
          <input
            v-model="epicForm.title"
            type="text"
            placeholder="Epic title"
            required
          />
          <textarea
            v-model="epicForm.description"
            placeholder="Description (optional)"
            rows="3"
          ></textarea>
          <button type="submit" :disabled="!epicForm.title">Add Epic</button>
        </form>
      </div>
    </div>

    <div class="hierarchy-container">
      <div v-if="store.stories.length === 0" class="empty-state">
        <p>No stories yet. Add an epic to get started.</p>
      </div>

      <div v-for="epic in store.stories" :key="epic.id" class="epic-item">
        <div class="epic-header" @click="toggleEpic(epic.id)">
          <span class="toggle-icon">{{ expandedEpics.has(epic.id) ? '▼' : '▶' }}</span>
          <span class="epic-title">{{ epic.title }}</span>
          <button @click.stop="deleteEpic(epic.id)" class="btn-delete">Delete</button>
        </div>

        <div v-if="expandedEpics.has(epic.id)" class="epic-content">
          <div class="add-story-form">
            <form @submit.prevent="() => addStory(epic.id)">
              <input
                :value="getStoryFormValue(epic.id)"
                @input="setStoryFormValue(epic.id, $event)"
                type="text"
                placeholder="Story title"
                required
              />
              <button type="submit" :disabled="!getStoryFormValue(epic.id)">Add Story</button>
            </form>
          </div>

          <div v-for="story in epic.stories" :key="story.id" class="story-item">
            <div class="story-header" @click="toggleStory(story.id)">
              <span class="toggle-icon">{{ expandedStories.has(story.id) ? '▼' : '▶' }}</span>
              <span class="story-title">{{ story.title }}</span>
              <span v-if="story.estimate" class="estimate">Est: {{ story.estimate }}</span>
              <button @click.stop="deleteStory(story.id)" class="btn-delete">Delete</button>
            </div>

            <div v-if="expandedStories.has(story.id)" class="story-content">
              <div class="add-task-form">
                <form @submit.prevent="() => addTask(story.id)">
                  <input
                    :value="getTaskFormValue(story.id)"
                    @input="setTaskFormValue(story.id, $event)"
                    type="text"
                    placeholder="Task title"
                    required
                  />
                  <button type="submit" :disabled="!getTaskFormValue(story.id)">Add Task</button>
                </form>
              </div>

              <div v-for="task in story.tasks" :key="task.id" class="task-item">
                <span class="task-title">{{ task.title }}</span>
                <span v-if="task.estimate" class="estimate">Est: {{ task.estimate }}</span>
                <button @click="deleteTask(task.id)" class="btn-delete">Delete</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useSessionStore } from '../stores/sessionStore'

const store = useSessionStore()
const fileInput = ref<HTMLInputElement>()
const showAddEpicForm = ref(false)
const expandedEpics = ref(new Set<string>())
const expandedStories = ref(new Set<string>())

const epicForm = ref({
  title: '',
  description: ''
})

const storyForm = ref<Record<string, { title: string }>>({})
const taskForm = ref<Record<string, { title: string }>>({})

const toggleEpic = (epicId: string) => {
  if (expandedEpics.value.has(epicId)) {
    expandedEpics.value.delete(epicId)
  } else {
    expandedEpics.value.add(epicId)
  }
}

const toggleStory = (storyId: string) => {
  if (expandedStories.value.has(storyId)) {
    expandedStories.value.delete(storyId)
  } else {
    expandedStories.value.add(storyId)
  }
}

const addEpic = () => {
  if (!epicForm.value.title) return
  store.addStory({
    id: `epic-${Date.now()}`,
    title: epicForm.value.title,
    description: epicForm.value.description,
    stories: []
  })
  epicForm.value = { title: '', description: '' }
  showAddEpicForm.value = false
}

const addStory = (epicId: string) => {
  const title = storyForm.value[epicId]?.title
  if (!title) return
  const epic = store.stories.find(e => e.id === epicId)
  if (!epic) return
  epic.stories.push({
    id: `story-${Date.now()}`,
    title,
    tasks: []
  })
  storyForm.value[epicId] = { title: '' }
}

const addTask = (storyId: string) => {
  const title = taskForm.value[storyId]?.title
  if (!title) return
  for (const epic of store.stories) {
    const story = epic.stories.find(s => s.id === storyId)
    if (story) {
      story.tasks.push({
        id: `task-${Date.now()}`,
        title
      })
      taskForm.value[storyId] = { title: '' }
      return
    }
  }
}

const deleteEpic = (epicId: string) => {
  store.stories = store.stories.filter(e => e.id !== epicId)
}

const deleteStory = (storyId: string) => {
  for (const epic of store.stories) {
    const idx = epic.stories.findIndex(s => s.id === storyId)
    if (idx >= 0) {
      epic.stories.splice(idx, 1)
      return
    }
  }
}

const deleteTask = (taskId: string) => {
  for (const epic of store.stories) {
    for (const story of epic.stories) {
      const idx = story.tasks.findIndex(t => t.id === taskId)
      if (idx >= 0) {
        story.tasks.splice(idx, 1)
        return
      }
    }
  }
}

const triggerMarkdownImport = () => {
  fileInput.value?.click()
}

const handleMarkdownImport = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const content = await file.text()
  // TODO: Parse markdown and import into store
}

const getTaskFormValue = (storyId: string): string => {
  return taskForm.value[storyId]?.title || ''
}

const setTaskFormValue = (storyId: string, event: Event) => {
  const target = event.target as HTMLInputElement
  if (!taskForm.value[storyId]) {
    taskForm.value[storyId] = { title: '' }
  }
  taskForm.value[storyId].title = target.value
}

const getStoryFormValue = (epicId: string): string => {
  return storyForm.value[epicId]?.title || ''
}

const setStoryFormValue = (epicId: string, event: Event) => {
  const target = event.target as HTMLInputElement
  if (!storyForm.value[epicId]) {
    storyForm.value[epicId] = { title: '' }
  }
  storyForm.value[epicId].title = target.value
}
</script>

<style scoped>
.story-panel {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

.story-controls {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  padding: var(--space-xl);
  border-radius: 8px;
}

.control-buttons {
  display: flex;
  gap: var(--space-md);
  margin: var(--space-md) 0;
}

.btn-primary,
.btn-secondary {
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: transform 0.2s, box-shadow 0.2s;
}

.btn-primary {
  background: linear-gradient(135deg, var(--accent-dark), var(--accent));
  border: none;
  color: var(--bg-primary);
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(212, 165, 116, 0.2);
}

.btn-secondary {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-primary);
  transition: all 0.2s;
}

.btn-secondary:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.btn-delete {
  background: transparent;
  color: var(--danger);
  border: 1px solid var(--border);
  padding: 0.4rem 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.btn-delete:hover {
  border-color: var(--danger);
}

.form-container {
  margin-top: var(--space-md);
}

form {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

input,
textarea {
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  color: var(--text-primary);
  font-size: 0.875rem;
  font-family: inherit;
  transition: border-color 0.2s;
}

input::placeholder,
textarea::placeholder {
  color: var(--text-muted);
}

input:focus,
textarea:focus {
  outline: none;
  border-color: var(--accent);
}

textarea {
  resize: vertical;
}

.hierarchy-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.empty-state {
  padding: var(--space-2xl);
  text-align: center;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text-muted);
}

.epic-item,
.story-item {
  background: var(--bg-tertiary);
  border-radius: 8px;
  border-left: 3px solid var(--accent);
  transition: all 0.3s var(--ease-bounce);
}

.epic-item:hover,
.story-item:hover {
  background: #2f3a4d;
  border-left-color: var(--accent-light);
  transform: translateX(4px);
}

.epic-header,
.story-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md);
  cursor: pointer;
  user-select: none;
}

.story-header {
  padding: var(--space-sm) var(--space-md);
  margin-left: var(--space-2xl);
}

.toggle-icon {
  display: inline-block;
  width: 1rem;
  text-align: center;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.epic-title,
.story-title,
.task-title {
  flex: 1;
  font-weight: 600;
  color: var(--text-primary);
}

.estimate {
  background-color: var(--bg-secondary);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.875rem;
  color: var(--accent-light);
}

.epic-content {
  padding: var(--space-md);
  border-top: 1px solid var(--border);
}

.story-content {
  padding: var(--space-sm) var(--space-md);
}

.add-story-form,
.add-task-form {
  margin-bottom: var(--space-md);
}

.task-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm);
  margin-left: var(--space-2xl);
  background-color: var(--bg-secondary);
  border-radius: 6px;
  margin-bottom: var(--space-xs);
}

h2 {
  margin: 0 0 var(--space-md) 0;
  color: var(--text-primary);
}
</style>
