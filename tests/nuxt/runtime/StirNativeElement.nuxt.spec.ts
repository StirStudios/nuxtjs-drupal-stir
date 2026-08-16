import { defineComponent } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'

describe('native Drupal component-tree elements', () => {
  it('renders native elements through the Stir Drupal facade', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const wrapper = await mountSuspended(defineComponent({
      setup() {
        const { renderCustomElements } = useStirDrupalCe()
        const rendered = renderCustomElements({
          element: 'a',
          props: { href: '/user/1' },
          slots: { default: 'admin' },
        })

        return () => rendered
      },
    }))

    expect(wrapper.html()).toContain('<a')
    expect(wrapper.get('a').attributes('href')).toBe('/user/1')
    expect(wrapper.text()).toBe('admin')
    expect(warn).not.toHaveBeenCalledWith(
      expect.stringContaining('Failed to resolve component: a'),
    )

    warn.mockRestore()
  })
})
