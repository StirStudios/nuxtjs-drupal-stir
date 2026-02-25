import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { WebformFieldProps, WebformState } from '../../../types'
import FieldRenderer from '../../../app/components/Field/Renderer.vue'

describe('FieldRenderer (Nuxt runtime)', () => {
  it('renders hidden fields as native hidden input', async () => {
    const field: WebformFieldProps = {
      '#type': 'hidden',
      '#title': 'Token',
      '#name': 'token',
      '#defaultValue': 'abc123',
    }
    const state: WebformState = {}

    const wrapper = await mountSuspended(FieldRenderer, {
      props: {
        field,
        fieldName: 'token',
        state,
      },
    })

    const hiddenInput = wrapper.find('input[type="hidden"]')

    expect(hiddenInput.exists()).toBe(true)
    expect(hiddenInput.attributes('name')).toBe('token')
    expect(hiddenInput.attributes('value')).toBe('abc123')
  })

  it('does not render relocated non-hidden fields unless bypassed', async () => {
    const field: WebformFieldProps = {
      '#type': 'textfield',
      '#title': 'Full name',
      '#name': 'full_name',
      '#relocated': true,
    }
    const state: WebformState = {}

    const wrapper = await mountSuspended(FieldRenderer, {
      props: {
        field,
        fieldName: 'full_name',
        state,
      },
    })

    expect(wrapper.find('input').exists()).toBe(false)
    expect(wrapper.text().trim()).toBe('')
  })
})
