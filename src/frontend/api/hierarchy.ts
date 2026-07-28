import { getHierarchy } from './client'
import type { useSessionStore } from '../stores/sessionStore'
import type { Epic } from '../stores/sessionStore'

type Store = ReturnType<typeof useSessionStore>

export async function loadHierarchyIntoStore(store: Store): Promise<void> {
  if (!store.activeSession) return
  const hierarchy = await getHierarchy(store.activeSession.slug)
  store.stories = hierarchy.epics.map((epic): Epic => ({
    id: epic.id,
    title: epic.title,
    description: epic.description || undefined,
    stories: epic.stories.map(story => ({
      id: story.id,
      title: story.title,
      description: story.description || undefined,
      estimate: story.estimatePoints ?? undefined,
      tasks: story.tasks.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description || undefined,
        estimate: task.estimatePoints ?? undefined,
      })),
    })),
  }))
}
