import { h, nextTick, ref, resolveDirective, withDirectives } from 'vue'
import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'

describe('v-drupal-markup', () => {
  it('renders the markup and replaces it when the value changes', async () => {
    const html = ref('<p>First</p>')
    const wrapper = await mountSuspended({
      setup() {
        const directive = resolveDirective('drupal-markup')!

        return () => withDirectives(h('div'), [[directive, html.value]])
      },
    })

    expect(wrapper.html()).toContain('<p>First</p>')

    html.value = '<p>Second</p>'
    await nextTick()
    expect(wrapper.html()).toContain('<p>Second</p>')
    expect(wrapper.html()).not.toContain('First')
  })

  it('keeps markup already in the element when it mounts', async () => {
    const wrapper = await mountSuspended({
      setup() {
        const directive = resolveDirective('drupal-markup')!

        return () => withDirectives(h('div', [h('span', 'Server')]), [[directive, '<p>Client</p>']])
      },
    })

    expect(wrapper.html()).toContain('Server')
    expect(wrapper.html()).not.toContain('Client')
  })
})
