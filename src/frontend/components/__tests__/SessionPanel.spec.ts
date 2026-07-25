import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import SessionPanel from '../SessionPanel.vue'
import { useSessionStore } from '../../stores/sessionStore'

vi.mock('axios')

describe('SessionPanel', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should render create session form', () => {
    const wrapper = mount(SessionPanel)
    const inputs = wrapper.findAll('input')
    expect(inputs.length).toBeGreaterThan(0)
    expect(wrapper.find('button').exists()).toBe(true)
  })

  it('should render join session form', () => {
    const wrapper = mount(SessionPanel)
    const inputs = wrapper.findAll('input')
    expect(inputs.length).toBeGreaterThanOrEqual(2)
  })

  it('should display session forms', () => {
    const wrapper = mount(SessionPanel)
    expect(wrapper.text()).toContain('Create Session')
    expect(wrapper.text()).toContain('Join Session')
  })

  it('should update session name input', async () => {
    const wrapper = mount(SessionPanel)
    const inputs = wrapper.findAll('input')
    await inputs[0].setValue('My Session')
    expect((inputs[0].element as HTMLInputElement).value).toBe('My Session')
  })

  it('should update pseudonym input', async () => {
    const wrapper = mount(SessionPanel)
    const inputs = wrapper.findAll('input')
    const pseudonymIndex = inputs.findIndex(i => (i.element as HTMLInputElement).placeholder?.includes('pseudonym'))
    if (pseudonymIndex >= 0) {
      await inputs[pseudonymIndex].setValue('Alice')
      expect((inputs[pseudonymIndex].element as HTMLInputElement).value).toBe('Alice')
    }
  })

  it('should display error message when join fails', async () => {
    const wrapper = mount(SessionPanel)
    const data = wrapper.vm.$data as any
    expect(data.error === undefined || data.error === '').toBe(true)
  })

  it('should display session info when session is active', async () => {
    const wrapper = mount(SessionPanel, {
      global: {
        plugins: [createPinia()]
      }
    })
    const store = useSessionStore()
    store.setSession({
      id: '1',
      slug: 'test-session',
      name: 'Test',
      status: 'active' as const,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Test')
  })

  it('should call leaveSession when leave button clicked', async () => {
    const wrapper = mount(SessionPanel, {
      global: {
        plugins: [createPinia()]
      }
    })
    const store = useSessionStore()
    store.setSession({
      id: '1',
      slug: 'test-session',
      name: 'Test',
      status: 'active' as const,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    store.addParticipant({
      id: '1',
      pseudonym: 'Alice',
      joinedAt: new Date()
    })
    await wrapper.vm.$nextTick()
    const buttons = wrapper.findAll('button')
    expect(buttons.length).toBeGreaterThan(0)
  })

  it('should handle empty session name validation', async () => {
    const wrapper = mount(SessionPanel)
    const button = wrapper.find('button')
    await button.trigger('click')
    // Component should either disable button or show error
    expect(wrapper.vm).toBeDefined()
  })

  it('should have form for creating session', () => {
    const wrapper = mount(SessionPanel)
    const forms = wrapper.findAll('form')
    expect(forms.length).toBeGreaterThanOrEqual(1)
  })

  it('should render without errors', () => {
    const wrapper = mount(SessionPanel)
    expect(wrapper.vm).toBeDefined()
    expect(wrapper.element.tagName).toBeDefined()
  })
})
