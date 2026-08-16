import { defineComponent } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'

describe('field-entity-reference compatibility component', () => {
  it('is registered with the Drupal runtime component resolver', async () => {
    const wrapper = await mountSuspended(defineComponent({
      setup() {
        const { resolveCustomElement } = useDrupalCe()

        return {
          resolved: Boolean(resolveCustomElement?.('field-entity-reference')),
        }
      },
      template: '<span>{{ resolved }}</span>',
    }))

    expect(wrapper.text()).toBe('true')
  })

  it('resolves Drupal field elements without a Vue warning', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const wrapper = await mountSuspended(defineComponent({
      template: '<field-entity-reference id="7" label="Content owner" />',
    }))

    expect(wrapper.text()).toBe('Content owner')
    expect(warn).not.toHaveBeenCalledWith(
      expect.stringContaining('Failed to resolve component: field-entity-reference'),
    )

    warn.mockRestore()
  })
})
