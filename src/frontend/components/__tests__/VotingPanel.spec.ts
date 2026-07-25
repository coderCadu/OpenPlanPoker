import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import VotingPanel from '../VotingPanel.vue'
import { useSessionStore } from '../../stores/sessionStore'

vi.mock('axios')

describe('VotingPanel', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should display empty state when no session', () => {
    const wrapper = mount(VotingPanel)
    const text = wrapper.text()
    expect(text.includes('No active session') || text.includes('session')).toBe(true)
  })

  it('should display voting container when session active', async () => {
    const wrapper = mount(VotingPanel)
    const store = useSessionStore()
    store.setSession({
      id: '1',
      slug: 'test',
      name: 'Test',
      status: 'active' as const,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Current Task')
  })

  it('should display fibonacci cards', () => {
    const wrapper = mount(VotingPanel)
    const store = useSessionStore()
    store.setSession({
      id: '1',
      slug: 'test',
      name: 'Test',
      status: 'active' as const,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    const cards = wrapper.findAll('.card')
    expect(cards.length).toBe(9)
  })

  it('should have fibonacci cards with correct values', () => {
    const wrapper = mount(VotingPanel)
    const expectedCards = ['1', '2', '3', '5', '8', '13', '21', '?', '☕']
    const cardTexts = wrapper.findAll('.card').map(c => c.text())
    expectedCards.forEach(card => {
      expect(cardTexts.includes(card)).toBe(true)
    })
  })

  it('should highlight selected card', async () => {
    const wrapper = mount(VotingPanel)
    const store = useSessionStore()
    store.setSession({
      id: '1',
      slug: 'test',
      name: 'Test',
      status: 'active' as const,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    store.setCurrentUser({ id: 'user1', pseudonym: 'Alice' })
    store.addStory({
      id: 'epic1',
      title: 'Epic',
      stories: [
        {
          id: 'story1',
          title: 'Story',
          tasks: [{ id: 'task1', title: 'Task' }]
        }
      ]
    })
    await wrapper.vm.$nextTick()
    const cards = wrapper.findAll('.card')
    await cards[0].trigger('click')
    await wrapper.vm.$nextTick()
    expect(cards[0].classes()).toContain('selected')
  })

  it('should record vote when card clicked', async () => {
    const wrapper = mount(VotingPanel)
    const store = useSessionStore()
    store.setSession({
      id: '1',
      slug: 'test',
      name: 'Test',
      status: 'active' as const,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    store.setCurrentUser({ id: 'user1', pseudonym: 'Alice' })
    store.addStory({
      id: 'epic1',
      title: 'Epic',
      stories: [
        {
          id: 'story1',
          title: 'Story',
          tasks: [{ id: 'task1', title: 'Task' }]
        }
      ]
    })
    await wrapper.vm.$nextTick()
    expect(store.votes.length).toBe(0)
    const cards = wrapper.findAll('.card')
    await cards[2].trigger('click')
    expect(store.votes.length).toBeGreaterThan(0)
  })

  it('should display current task', async () => {
    const wrapper = mount(VotingPanel)
    const store = useSessionStore()
    store.setSession({
      id: '1',
      slug: 'test',
      name: 'Test',
      status: 'active' as const,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    store.addStory({
      id: 'epic1',
      title: 'Epic',
      stories: [
        {
          id: 'story1',
          title: 'Story',
          tasks: [{ id: 'task1', title: 'Important Task' }]
        }
      ]
    })
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Important Task')
  })

  it('should display no task message when all estimated', async () => {
    const wrapper = mount(VotingPanel)
    const store = useSessionStore()
    store.setSession({
      id: '1',
      slug: 'test',
      name: 'Test',
      status: 'active' as const,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    store.addStory({
      id: 'epic1',
      title: 'Epic',
      stories: [
        {
          id: 'story1',
          title: 'Story',
          tasks: [{ id: 'task1', title: 'Task', estimate: 5 }]
        }
      ]
    })
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('No tasks')
  })

  it('should display vote confirmation after voting', async () => {
    const wrapper = mount(VotingPanel)
    const store = useSessionStore()
    store.setSession({
      id: '1',
      slug: 'test',
      name: 'Test',
      status: 'active' as const,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    store.setCurrentUser({ id: 'user1', pseudonym: 'Alice' })
    store.addStory({
      id: 'epic1',
      title: 'Epic',
      stories: [
        {
          id: 'story1',
          title: 'Story',
          tasks: [{ id: 'task1', title: 'Task' }]
        }
      ]
    })
    await wrapper.vm.$nextTick()
    const cards = wrapper.findAll('.card')
    await cards[3].trigger('click')
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Your vote')
  })

  it('should have change vote button after voting', async () => {
    const wrapper = mount(VotingPanel)
    const store = useSessionStore()
    store.setSession({
      id: '1',
      slug: 'test',
      name: 'Test',
      status: 'active' as const,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    store.setCurrentUser({ id: 'user1', pseudonym: 'Alice' })
    store.addStory({
      id: 'epic1',
      title: 'Epic',
      stories: [
        {
          id: 'story1',
          title: 'Story',
          tasks: [{ id: 'task1', title: 'Task' }]
        }
      ]
    })
    await wrapper.vm.$nextTick()
    const cards = wrapper.findAll('.card')
    await cards[3].trigger('click')
    await wrapper.vm.$nextTick()
    const buttons = wrapper.findAll('button')
    const changeBtn = buttons.find(b => b.text().toLowerCase().includes('change'))
    expect(changeBtn).toBeDefined()
  })

  it('should display unestimated task count', async () => {
    const wrapper = mount(VotingPanel)
    const store = useSessionStore()
    store.setSession({
      id: '1',
      slug: 'test',
      name: 'Test',
      status: 'active' as const,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    store.addStory({
      id: 'epic1',
      title: 'Epic',
      stories: [
        {
          id: 'story1',
          title: 'Story',
          tasks: [
            { id: 'task1', title: 'Task 1' },
            { id: 'task2', title: 'Task 2' },
            { id: 'task3', title: 'Task 3' }
          ]
        }
      ]
    })
    await wrapper.vm.$nextTick()
    const text = wrapper.text()
    expect(text.includes('remaining') || text.includes('tasks')).toBe(true)
  })

  it('should render component successfully', () => {
    const wrapper = mount(VotingPanel)
    expect(wrapper.vm).toBeDefined()
  })

  it('should have proper section structure', async () => {
    const wrapper = mount(VotingPanel)
    const store = useSessionStore()
    store.setSession({
      id: '1',
      slug: 'test',
      name: 'Test',
      status: 'active' as const,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    await wrapper.vm.$nextTick()
    const sections = wrapper.findAll('.voting-container, .empty-state')
    expect(sections.length).toBeGreaterThan(0)
  })

  it('should have voting panel container', () => {
    const wrapper = mount(VotingPanel)
    expect(wrapper.find('.voting-panel').exists()).toBe(true)
  })
})
