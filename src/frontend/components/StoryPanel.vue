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
  gap: 1.5rem;
}

.story-controls {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.control-buttons {
  display: flex;
  gap: 1rem;
  margin: 1rem 0;
}

.btn-primary,
.btn-secondary {
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s;
}

.btn-primary {
  background-color: #4a90e2;
  color: white;
}

.btn-primary:hover {
  background-color: #357abd;
}

.btn-secondary {
  background-color: #27ae60;
  color: white;
}

.btn-secondary:hover {
  background-color: #229954;
}

.btn-delete {
  background-color: #e74c3c;
  color: white;
  border: none;
  padding: 0.5rem 0.75rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
}

.btn-delete:hover {
  background-color: #c0392b;
}

.form-container {
  margin-top: 1rem;
}

form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

input,
textarea {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  font-family: inherit;
}

input:focus,
textarea:focus {
  outline: none;
  border-color: #4a90e2;
  box-shadow: 0 0 4px rgba(74, 144, 226, 0.2);
}

textarea {
  resize: vertical;
}

.hierarchy-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.empty-state {
  padding: 2rem;
  text-align: center;
  background: #f5f5f5;
  border-radius: 8px;
  color: #999;
}

.epic-item,
.story-item {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.epic-header,
.story-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  cursor: pointer;
  background-color: #f9f9f9;
  border-radius: 8px 8px 0 0;
  user-select: none;
}

.story-header {
  padding: 0.75rem 1rem;
  margin-left: 2rem;
  background-color: #fbfbfb;
}

.epic-header:hover,
.story-header:hover {
  background-color: #f0f0f0;
}

.toggle-icon {
  display: inline-block;
  width: 1rem;
  text-align: center;
  font-size: 0.875rem;
}

.epic-title,
.story-title,
.task-title {
  flex: 1;
  font-weight: 500;
}

.estimate {
  background-color: #e8f4f8;
  padding: 0.25rem 0.5rem;
  border-radius: 3px;
  font-size: 0.875rem;
  color: #2980b9;
}

.epic-content {
  padding: 1rem;
  border-top: 1px solid #eee;
}

.story-content {
  padding: 0.75rem 1rem;
  background-color: #fafafa;
}

.add-story-form,
.add-task-form {
  margin-bottom: 1rem;
}

.task-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  margin-left: 2rem;
  background-color: #f5f5f5;
  border-radius: 4px;
  margin-bottom: 0.5rem;
}

h2 {
  margin: 0 0 1rem 0;
  color: #333;
}
</style>
