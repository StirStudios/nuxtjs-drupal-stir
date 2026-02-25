import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { WebformFieldProps, WebformState } from '../../../types'
import FieldRelocated from '../../../app/components/Field/Relocated.vue'

describe('FieldRelocated (Nuxt runtime)', () => {
  it('renders only relocated hidden fields via FieldRenderer', async () => {
    const fields: Record<string, WebformFieldProps> = {
      movedHidden: {
        '#type': 'hidden',
        '#title': 'Moved Hidden',
        '#name': 'moved_hidden',
        '#defaultValue': 'yes',
        '#relocated': true,
      },
      normalHidden: {
        '#type': 'hidden',
        '#title': 'Normal Hidden',
        '#name': 'normal_hidden',
        '#defaultValue': 'no',
      },
    }
    const state: WebformState = {}

    const wrapper = await mountSuspended(FieldRelocated, {
      props: {
        fields,
        state,
        orderedFieldNames: ['movedHidden', 'normalHidden'],
      },
    })

    const hiddenInputs = wrapper.findAll('input[type="hidden"]')
    const movedHiddenInput = hiddenInputs[0]

    expect(hiddenInputs).toHaveLength(1)
    expect(movedHiddenInput).toBeDefined()

    if (!movedHiddenInput) {
      throw new Error('Expected relocated hidden input')
    }

    expect(movedHiddenInput.attributes('name')).toBe('movedHidden')
    expect(movedHiddenInput.attributes('value')).toBe('yes')
  })
})
