import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import FieldValue from '../../../layers/theme/app/components/global/field-value.vue'

describe('field-value (Nuxt runtime)', () => {
  it.each([
    [480, '480'],
    [12.5, '12.5'],
    [true, 'true'],
    [false, 'false'],
  ])('renders the typed value %s without coercing its slot prop', async (value, text) => {
    let slottedValue: unknown
    const wrapper = await mountSuspended(FieldValue, {
      props: { value },
      slots: {
        default: ({ value: slotValue }: { value: unknown }) => {
          slottedValue = slotValue
          return String(slotValue)
        },
      },
    })

    expect(wrapper.text()).toBe(text)
    expect(slottedValue).toBe(value)
  })
})
