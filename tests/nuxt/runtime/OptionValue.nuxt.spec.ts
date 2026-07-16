import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import OptionValue from '../../../layers/theme/app/components/global/option-value.vue'

describe('option-value (Nuxt runtime)', () => {
  it('renders Drupal\'s configured label and exposes the stored value', async () => {
    let storedValue: unknown
    const wrapper = await mountSuspended(OptionValue, {
      props: {
        value: 'all_ages',
        label: 'All ages',
      },
      slots: {
        default: ({ value, label }: { value: unknown, label: string }) => {
          storedValue = value
          return label
        },
      },
    })

    expect(wrapper.text()).toBe('All ages')
    expect(storedValue).toBe('all_ages')
  })
})
