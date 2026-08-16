import { defineComponent } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import FieldEntityReference from '../../../layers/theme/app/components/global/field-entity-reference.vue'

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

  it('renders the nested authenticated entity-reference contract', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const wrapper = await mountSuspended(FieldEntityReference, {
      props: {
        targetId: '1',
        entity: {
          element: 'a',
          props: { href: '/user/1', type: 'user' },
          slots: { default: 'admin' },
        },
      },
    })

    expect(wrapper.get('a').attributes('href')).toBe('/user/1')
    expect(wrapper.text()).toBe('admin')
    expect(warn).not.toHaveBeenCalledWith(
      expect.stringContaining('Failed to resolve component: field-entity-reference'),
    )

    warn.mockRestore()
  })
})
