import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { WebformFieldProps, WebformState } from '../../../layers/theme/app/types'
import FieldRenderer from '../../../layers/webform/app/components/Field/Renderer.vue'

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
      '#type': 'text',
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

  it.each([
    ['processed_text', '#text'],
    ['webform_markup', '#markup'],
  ] as const)('renders trusted display content for %s', async (type, contentProperty) => {
    const field: WebformFieldProps = {
      '#type': type,
      '#name': 'privacy_notice',
      [contentProperty]: '<p>Read our <strong>privacy notice</strong>.</p>',
    }

    const wrapper = await mountSuspended(FieldRenderer, {
      props: {
        field,
        fieldName: 'privacy_notice',
        state: {},
      },
    })

    expect(wrapper.text()).toContain('Read our privacy notice.')
    expect(wrapper.find('strong').text()).toBe('privacy notice')
  })

  it('keeps checkbox help visible while using its concise title accessibly', async () => {
    const field: WebformFieldProps = {
      '#type': 'checkbox',
      '#name': 'privacy_consent',
      '#title': 'Privacy acknowledgement',
      '#description': 'See our <a href="/privacy-policy">Privacy Policy</a>.',
      '#required': true,
    }

    const wrapper = await mountSuspended(FieldRenderer, {
      props: {
        field,
        fieldName: 'privacy_consent',
        state: {},
      },
    })

    expect(wrapper.text()).toContain('Privacy acknowledgement')
    expect(wrapper.text()).toContain('See our Privacy Policy.')
    expect(wrapper.find('a').attributes('href')).toBe('/privacy-policy')
    expect(wrapper.find('[data-slot="label"]').classes()).toContain('sr-only')
  })

  it.each([
    ['checkboxes', { first: 'First choice' }],
    ['select', { first: 'First choice' }],
    ['date', undefined],
  ] as const)('keeps the %s label visible when floating labels are enabled', async (type, options) => {
    const field: WebformFieldProps = {
      '#type': type,
      '#name': 'example_field',
      '#title': 'Example field',
      '#floatingLabel': true,
      ...(options ? { '#options': options } : {}),
    }

    const wrapper = await mountSuspended(FieldRenderer, {
      props: {
        field,
        fieldName: 'example_field',
        state: {},
      },
    })

    expect(wrapper.find('[data-slot="label"]').text()).toBe('Example field')
  })
})
