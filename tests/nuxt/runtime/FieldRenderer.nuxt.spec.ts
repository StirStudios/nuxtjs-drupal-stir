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

  it('keeps the checkboxes label visible when floating labels are enabled', async () => {
    const field: WebformFieldProps = {
      '#type': 'checkboxes',
      '#name': 'example_field',
      '#title': 'Example field',
      '#floatingLabel': true,
      '#options': { first: 'First choice' },
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

  it('keeps structural floating-label classes independent of app config', async () => {
    const field: WebformFieldProps = {
      '#type': 'textfield',
      '#name': 'example_field',
      '#title': 'Example field',
      '#floatingLabel': true,
    }

    const wrapper = await mountSuspended(FieldRenderer, {
      props: {
        field,
        fieldName: 'example_field',
        state: {},
      },
    })

    const label = wrapper.get('label')

    expect(label.classes()).toContain('absolute')
    expect(label.classes()).toContain('pointer-events-none')
    expect(label.classes()).toContain('z-10')
    expect(label.classes()).toContain('text-default')
    expect(label.classes()).toContain('text-sm')
    expect(label.classes()).toContain('font-medium')
    expect(label.classes()).toContain('peer-placeholder-shown:text-dimmed')
    expect(label.classes()).toContain('peer-placeholder-shown:text-base')
  })

  it.each([
    ['select', { first: 'First choice' }],
    ['date', undefined],
  ] as const)('associates the floating %s label with its control', async (type, options) => {
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

    const labels = wrapper.findAll('label')
      .filter(label => label.text() === 'Example field')

    expect(labels).toHaveLength(1)

    const controlId = labels[0]!.attributes('for')

    expect(controlId).toBeTruthy()
    expect(wrapper.find(`[id="${controlId}"]`).exists()).toBe(true)
  })

  it('preserves the form-field contract for selects', async () => {
    const field: WebformFieldProps = {
      '#type': 'select',
      '#name': 'region',
      '#title': 'Region',
      '#options': { west: 'West' },
      '#states': {
        disabled: {
          ':input[name="country"]': { value: 'US' },
        },
      },
    }

    const wrapper = await mountSuspended(FieldRenderer, {
      props: {
        field,
        fieldName: 'region',
        state: { country: 'US' },
      },
    })

    const select = wrapper.get('button[role="combobox"]')

    expect(select.attributes('disabled')).toBeDefined()
    expect(select.attributes('id')).toBeTruthy()
    expect(select.attributes('aria-invalid')).toBe('false')
  })

  it('lets a datetime composite own its date and time labels', async () => {
    const field: WebformFieldProps = {
      '#type': 'datetime',
      '#name': 'appointment',
      '#title': 'Appointment',
      '#floatingLabel': true,
    }

    const wrapper = await mountSuspended(FieldRenderer, {
      props: {
        field,
        fieldName: 'appointment',
        state: {},
      },
    })

    const labels = wrapper.findAll('[data-slot="label"]')
      .map(label => label.text())

    expect(labels.filter(label => label === 'Appointment')).toHaveLength(1)
    expect(labels).toContain('Time')
  })
})
