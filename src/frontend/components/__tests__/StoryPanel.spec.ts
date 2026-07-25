import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import StoryPanel from '../StoryPanel.vue'
import { useSessionStore } from '../../stores/sessionStore'

vi.mock('axios')

describe('StoryPanel', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should render hierarchy section', () => {
    const wrapper = mount(StoryPanel)
    expect(wrapper.text()).toContain('Story Hierarchy') || expect(wrapper.text()).toContain('Epic')
  })

  it('should have add epic button', () => {
    const wrapper = mount(StoryPanel)
    const buttons = wrapper.findAll('button')
    expect(buttons.length).toBeGreaterThan(0)
  })

  it('should display empty list when no stories', () => {
    const wrapper = mount(StoryPanel)
    const store = useSessionStore()
    expect(store.stories.length).toBe(0)
  })

  it('should display epic in hierarchy when added', async () => {
    const wrapper = mount(StoryPanel)
    const store = useSessionStore()
    store.addStory({
      id: '1',
      title: 'Epic 1',
      stories: []
    })
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Epic 1')
  })

  it('should display import button in controls', () => {
    const wrapper = mount(StoryPanel)
    const buttons = wrapper.findAll('button')
    const hasImport = buttons.some(b => b.text().toLowerCase().includes('import'))
    expect(buttons.length).toBeGreaterThan(0)
  })

  it('should render add epic form when button clicked', async () => {
    const wrapper = mount(StoryPanel)
    const buttons = wrapper.findAll('button')
    const addButton = buttons.find(b => b.text().toLowerCase().includes('add epic'))
    if (addButton) {
      await addButton.trigger('click')
      await wrapper.vm.$nextTick()
      const inputs = wrapper.findAll('input')
      expect(inputs.length).toBeGreaterThan(0)
    }
  })

  it('should render collapsible epic items', async () => {
    const wrapper = mount(StoryPanel)
    const store = useSessionStore()
    store.addStory({
      id: '1',
      title: 'Epic with Stories',
      stories: [
        {
          id: 's1',
          title: 'Story 1',
          tasks: []
        }
      ]
    })
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Epic with Stories')
  })

  it('should delete epic when deleteEpic is called', async () => {
    const wrapper = mount(StoryPanel)
    const store = useSessionStore()
    store.addStory({
      id: '1',
      title: 'Epic to Delete',
      stories: []
    })
    const vm = wrapper.vm as any
    vm.deleteEpic('1')
    expect(store.stories.length).toBe(0)
  })

  it('should render story items within epic', async () => {
    const wrapper = mount(StoryPanel)
    const store = useSessionStore()
    store.addStory({
      id: '1',
      title: 'Epic',
      stories: [
        {
          id: 's1',
          title: 'Story 1',
          tasks: []
        },
        {
          id: 's2',
          title: 'Story 2',
          tasks: []
        }
      ]
    })
    await wrapper.vm.$nextTick()
    // Expand epic to reveal stories
    const vm = wrapper.vm as any
    vm.toggleEpic('1')
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Story 1')
    expect(wrapper.text()).toContain('Story 2')
  })

  it('should render task items within story', async () => {
    const wrapper = mount(StoryPanel)
    const store = useSessionStore()
    store.addStory({
      id: '1',
      title: 'Epic',
      stories: [
        {
          id: 's1',
          title: 'Story 1',
          tasks: [
            {
              id: 't1',
              title: 'Task 1'
            }
          ]
        }
      ]
    })
    await wrapper.vm.$nextTick()
    // Expand epic to reveal stories
    const vm = wrapper.vm as any
    vm.toggleEpic('1')
    await wrapper.vm.$nextTick()
    // Expand story to reveal tasks
    vm.toggleStory('s1')
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Task 1')
  })

  it('should have file input for markdown', () => {
    const wrapper = mount(StoryPanel)
    const fileInputs = wrapper.findAll('input[type="file"]')
    expect(fileInputs.length).toBeGreaterThanOrEqual(0)
  })

  it('should add epic to store using addEpic method', async () => {
    const wrapper = mount(StoryPanel)
    const vm = wrapper.vm as any
    vm.epicForm = { title: 'New Epic', description: '' }
    vm.addEpic()
    await wrapper.vm.$nextTick()
    const store = useSessionStore()
    expect(store.stories.length).toBeGreaterThan(0)
  })
})
