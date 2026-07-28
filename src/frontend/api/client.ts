import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
})

export interface SessionDto {
  id: string
  slug: string
  name: string
  moderatorId: string
  description: string | null
  status: 'ACTIVE' | 'CLOSED' | 'ARCHIVED'
  createdAt?: string
  lastActivityAt?: string
  participants?: ParticipantDto[]
}

export interface ParticipantDto {
  id: string
  sessionId: string
  pseudonym: string
  joinedAt: string
}

export interface EpicDto {
  id: string
  sessionId: string
  title: string
  description: string | null
  createdAt: string
}

export interface StoryDto {
  id: string
  epicId: string
  title: string
  description: string | null
  createdAt: string
}

export interface TaskDto {
  id: string
  storyId: string
  title: string
  description: string | null
  estimatePoints: number | null
  createdAt: string
}

export interface HierarchyTaskDto {
  id: string
  title: string
  description: string | null
  estimatePoints: number | null
}

export interface HierarchyStoryDto {
  id: string
  title: string
  description: string | null
  estimatePoints: number | null
  tasks: HierarchyTaskDto[]
}

export interface HierarchyEpicDto {
  id: string
  title: string
  description: string | null
  estimatePoints: number | null
  stories: HierarchyStoryDto[]
}

export interface HierarchyDto {
  epics: HierarchyEpicDto[]
}

export interface VoteDto {
  id: string
  taskId: string
  participantId: string
  sessionId: string
  card: string
  createdAt: string
}

export interface RevealResultDto {
  taskId: string
  votes: { participantId: string; card: string }[]
  average: number | null
  median: number | null
}

export async function createSession(name: string, moderatorId: string, description?: string): Promise<SessionDto> {
  const { data } = await api.post<SessionDto>('/sessions', { name, moderatorId, description })
  return data
}

export async function getSession(slug: string): Promise<SessionDto> {
  const { data } = await api.get<SessionDto>(`/sessions/${slug}`)
  return data
}

export async function joinSession(slug: string, pseudonym: string): Promise<ParticipantDto> {
  const { data } = await api.post<ParticipantDto>(`/sessions/${slug}/join`, { pseudonym })
  return data
}

export async function leaveSession(slug: string, pseudonym: string): Promise<void> {
  await api.post(`/sessions/${slug}/leave`, { pseudonym })
}

export async function closeSession(slug: string, moderatorId: string): Promise<void> {
  await api.post(`/sessions/${slug}/close`, { moderatorId })
}

export async function getHierarchy(slug: string): Promise<HierarchyDto> {
  const { data } = await api.get<HierarchyDto>(`/sessions/${slug}/hierarchy`)
  return data
}

export interface ImportMarkdownResultDto {
  epicsCreated: number
  storiesCreated: number
  tasksCreated: number
}

export async function importMarkdown(slug: string, markdown: string): Promise<ImportMarkdownResultDto> {
  const { data } = await api.post<ImportMarkdownResultDto>(`/sessions/${slug}/import-markdown`, { markdown })
  return data
}

export async function createEpic(sessionId: string, title: string, description?: string): Promise<EpicDto> {
  const { data } = await api.post<EpicDto>('/epics', { sessionId, title, description })
  return data
}

export async function deleteEpic(epicId: string): Promise<void> {
  await api.delete(`/epics/${epicId}`)
}

export async function createStory(
  epicId: string,
  sessionId: string,
  title: string,
  description?: string
): Promise<StoryDto> {
  const { data } = await api.post<StoryDto>(`/epics/${epicId}/stories`, { sessionId, title, description })
  return data
}

export async function deleteStory(storyId: string): Promise<void> {
  await api.delete(`/stories/${storyId}`)
}

export async function createTask(
  storyId: string,
  sessionId: string,
  title: string,
  description?: string
): Promise<TaskDto> {
  const { data } = await api.post<TaskDto>(`/stories/${storyId}/tasks`, { sessionId, title, description })
  return data
}

export async function deleteTask(taskId: string): Promise<void> {
  await api.delete(`/tasks/${taskId}`)
}

export async function castVote(
  taskId: string,
  participantId: string,
  sessionId: string,
  card: string
): Promise<VoteDto> {
  const { data } = await api.post<VoteDto>(`/tasks/${taskId}/vote`, { participantId, sessionId, card })
  return data
}

export async function getVotes(taskId: string): Promise<VoteDto[]> {
  const { data } = await api.get<VoteDto[]>(`/tasks/${taskId}/votes`)
  return data
}

export async function updateVote(voteId: string, card: string): Promise<VoteDto> {
  const { data } = await api.put<VoteDto>(`/votes/${voteId}`, { card })
  return data
}

export async function revealVotes(taskId: string, sessionId: string): Promise<RevealResultDto> {
  const { data } = await api.post<RevealResultDto>(`/tasks/${taskId}/reveal`, { sessionId })
  return data
}

export async function confirmEstimate(taskId: string, card: number | string): Promise<TaskDto> {
  const { data } = await api.put<TaskDto>(`/tasks/${taskId}/estimate`, { card })
  return data
}

export function exportMarkdownUrl(slug: string): string {
  const base = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')
  return `${base}/sessions/${slug}/export/markdown`
}
