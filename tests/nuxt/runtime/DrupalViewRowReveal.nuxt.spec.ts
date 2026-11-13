import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, provide } from 'vue'
import ViewRowReveal from '../../../layers/theme/app/components/Drupal/ViewRowReveal.vue'
import { drupalViewRowRevealKey } from '../../../layers/theme/app/utils/drupalViewContext'

describe('DrupalViewRowReveal', () => {
  it('reveals a custom grid row with the View\'s motion and registers it', async () => {
    const register = vi.fn()
    const getRowMotionProps = vi.fn(() => ({
      initial: { opacity: 0, y: 50 },
      whileInView: { opacity: 1, y: 0 },
    }))
    const Host = defineComponent({
      setup() {
        provide(drupalViewRowRevealKey, { getRowMotionProps, isShown: () => false, register })
        return () => h(ViewRowReveal, { index: 2, as: 'article' }, () => 'Row')
      },
    })
    const wrapper = await mountSuspended(Host)

    expect(getRowMotionProps).toHaveBeenCalledWith(2)
    expect(register).toHaveBeenCalledOnce()
    expect(wrapper.get('article.reveal-motion').text()).toBe('Row')
    wrapper.unmount()
  })

  it('shows a row added after the View is on screen at once', async () => {
    const getRowMotionProps = vi.fn(() => ({ whileInView: { opacity: 1 } }))
    const Host = defineComponent({
      setup() {
        provide(drupalViewRowRevealKey, { getRowMotionProps, isShown: () => true, register: vi.fn() })
        return () => h(ViewRowReveal, { index: 0 }, () => 'Row')
      },
    })
    const wrapper = await mountSuspended(Host)

    expect(getRowMotionProps).not.toHaveBeenCalled()
    expect(wrapper.get('.reveal-motion').text()).toBe('Row')
    wrapper.unmount()
  })

  it('renders the row plainly outside a View', async () => {
    const wrapper = await mountSuspended(ViewRowReveal, {
      props: { index: 0 },
      slots: { default: () => 'Row' },
    })

    expect(wrapper.get('div').text()).toBe('Row')
    expect(wrapper.find('.reveal-motion').exists()).toBe(false)
    wrapper.unmount()
  })
})
