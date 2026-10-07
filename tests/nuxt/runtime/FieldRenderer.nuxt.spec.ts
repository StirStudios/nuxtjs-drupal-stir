import { describe, expect, it, vi } from 'vitest'
import { nextTick, reactive } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { WebformFieldProps, WebformState } from '../../../layers/theme/app/types'
import FieldRenderer from '../../../layers/webform/app/components/Field/Renderer.vue'
import { normalizeWebformDefinition } from '../../../layers/webform/app/utils/webformFieldUtils'
import { createWebformState } from '../../../layers/webform/app/utils/webformState'

// Fields reach components through the payload boundary, as in WebformForm.
function canonical(field: WebformFieldProps): WebformFieldProps {
  return normalizeWebformDefinition({ webformId: 'test', fields: { [field['#name']]: field } })
    .fields[field['#name']]!
}

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
    expect(wrapper.find('.prose.privacy_notice').exists()).toBe(true)
    expect(wrapper.find('[data-slot="root"]').exists()).toBe(false)
    expect(wrapper.find('[data-slot="wrapper"]').exists()).toBe(false)
  })

  it('preserves supporting content for display-only elements without a form-field wrapper', async () => {
    const field: WebformFieldProps = {
      '#type': 'processed_text',
      '#name': 'privacy_notice',
      '#text': '<p>Privacy notice.</p>',
      '#description': '<p>Before the notice.</p>',
      '#help': '<p>After the notice.</p>',
      '#modal': true,
    }

    const wrapper = await mountSuspended(FieldRenderer, {
      props: {
        field,
        fieldName: 'privacy_notice',
        state: {},
      },
    })

    expect(wrapper.text()).toContain('Before the notice.')
    expect(wrapper.text()).toContain('Privacy notice.')
    expect(wrapper.text()).toContain('After the notice.')
    expect(wrapper.find('[data-modal-id="privacy_notice"]').exists()).toBe(true)
    expect(wrapper.find('[data-slot="root"]').exists()).toBe(false)
    expect(wrapper.find('[data-slot="wrapper"]').exists()).toBe(false)
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
    expect(wrapper.find('.form-input').element.parentElement?.classList)
      .toContain('mt-2')
  })

  it('adds the same label gap to radio groups', async () => {
    const field: WebformFieldProps = {
      '#type': 'radio',
      '#name': 'example_field',
      '#title': 'Example field',
      '#options': { first: 'First choice' },
    }

    const wrapper = await mountSuspended(FieldRenderer, {
      props: {
        field,
        fieldName: 'example_field',
        state: {},
      },
    })

    expect(wrapper.find('.form-input').element.parentElement?.classList)
      .toContain('mt-2')
  })

  it('does not add a group-label gap to standalone checkboxes', async () => {
    const field: WebformFieldProps = {
      '#type': 'checkbox',
      '#name': 'example_field',
      '#title': 'Example field',
    }

    const wrapper = await mountSuspended(FieldRenderer, {
      props: {
        field,
        fieldName: 'example_field',
        state: {},
      },
    })

    expect(wrapper.find('.form-input').element.parentElement?.classList)
      .not.toContain('mt-2')
  })

  it('tightens static material text labels without affecting floating labels', async () => {
    const appConfig = useAppConfig()
    const webform = appConfig.stirTheme.webform
    const previousVariant = webform.fieldVariant

    webform.fieldVariant = 'material'

    try {
      const staticWrapper = await mountSuspended(FieldRenderer, {
        props: {
          field: {
            '#type': 'textfield',
            '#name': 'static_field',
            '#title': 'Static field',
            '#floatingLabel': false,
          },
          fieldName: 'static_field',
          state: {},
        },
      })
      const floatingWrapper = await mountSuspended(FieldRenderer, {
        props: {
          field: {
            '#type': 'textfield',
            '#name': 'floating_field',
            '#title': 'Floating field',
            '#floatingLabel': true,
          },
          fieldName: 'floating_field',
          state: {},
        },
      })

      expect(
        staticWrapper.find('input').element.parentElement?.parentElement?.classList,
      ).toContain('-mt-0.5')
      expect(
        floatingWrapper.find('input').element.parentElement?.parentElement?.classList,
      ).not.toContain('-mt-0.5')
    }
    finally {
      webform.fieldVariant = previousVariant
    }
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

  // The marker UFormField puts on a required label, from the Nuxt UI theme.
  const requiredMarker = 'after:content-[\'*\']'

  it.each([
    ['textfield', undefined],
    ['email', undefined],
    ['tel', undefined],
    ['textarea', undefined],
  ] as const)('marks a required floating %s label and its control', async (type, options) => {
    const mount = (required: boolean) => mountSuspended(FieldRenderer, {
      props: {
        field: {
          '#type': type,
          '#name': 'example_field',
          '#title': 'Example field',
          '#floatingLabel': true,
          '#required': required,
          ...(options ? { '#options': options } : {}),
        },
        fieldName: 'example_field',
        state: {},
      },
    })
    const required = await mount(true)
    const label = required.get('label')

    expect(label.text()).toBe('Example field')
    expect(label.classes()).toContain(requiredMarker)
    expect(required.get(`[id="${label.attributes('for')}"]`).attributes('aria-required')).toBe('true')

    const optional = await mount(false)
    const optionalLabel = optional.get('label')

    expect(optionalLabel.classes()).not.toContain(requiredMarker)
    expect(optional.get(`[id="${optionalLabel.attributes('for')}"]`).attributes('aria-required')).not.toBe('true')
  })

  // Reka's select trigger sets aria-required from its own required prop, which
  // would also make its hidden native select block submission, so the select
  // gets the visual marker only.
  it('marks a required floating select label', async () => {
    const mount = (required: boolean) => mountSuspended(FieldRenderer, {
      props: {
        field: {
          '#type': 'select',
          '#name': 'region',
          '#title': 'Region',
          '#floatingLabel': true,
          '#required': required,
          '#options': { west: 'West' },
        },
        fieldName: 'region',
        state: {},
      },
    })

    expect((await mount(true)).get('label').classes()).toContain(requiredMarker)
    expect((await mount(false)).get('label').classes()).not.toContain(requiredMarker)
  })

  it('announces required static-label inputs too', async () => {
    const wrapper = await mountSuspended(FieldRenderer, {
      props: {
        field: {
          '#type': 'textfield',
          '#name': 'full_name',
          '#title': 'Full name',
          '#floatingLabel': false,
          '#required': true,
        },
        fieldName: 'full_name',
        state: {},
      },
    })

    expect(wrapper.get('input').attributes('aria-required')).toBe('true')
  })

  it('marks a required floating date label', async () => {
    const wrapper = await mountSuspended(FieldRenderer, {
      props: {
        field: {
          '#type': 'date',
          '#name': 'start_date',
          '#title': 'Start date',
          '#floatingLabel': true,
          '#required': true,
        },
        fieldName: 'start_date',
        state: {},
      },
    })

    expect(wrapper.get('label').classes()).toContain(requiredMarker)
  })

  it('marks each required floating address part', async () => {
    // InputType does not list 'address', although the renderer maps it.
    const field = {
      '#type': 'address',
      '#name': 'address',
      '#title': 'Address',
      '#floatingLabel': true,
      '#composite': {
        address: { label: 'Street', '#required': true },
        address_2: { label: 'Street line 2' },
        country: { label: 'Country', '#required': true, options: { GB: 'United Kingdom' } },
      },
    } as unknown as WebformFieldProps
    const address = canonical(field)
    const wrapper = await mountSuspended(FieldRenderer, {
      props: {
        field: address,
        fieldName: 'address',
        state: createWebformState({ address }),
      },
    })
    const labels = wrapper.findAll('label')
    const controlOf = (index: number) =>
      wrapper.get(`[id="${labels[index]!.attributes('for')}"]`)

    expect(labels.map(label => label.text())).toEqual(['Street', 'Street line 2', 'Country'])
    expect(labels.map(label => label.classes().includes(requiredMarker))).toEqual([true, false, true])
    expect(controlOf(0).attributes('aria-required')).toBe('true')
    expect(controlOf(1).attributes('aria-required')).toBeUndefined()
    expect(controlOf(2).attributes('aria-required')).toBe('true')
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
        field: canonical(field),
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

  it('reports an element type it cannot show instead of rendering an empty field', async () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
    const wrapper = await mountSuspended(FieldRenderer, {
      props: {
        field: canonical({ '#type': 'webform_signature' as never, '#name': 'signature', '#title': 'Sign here' }),
        fieldName: 'signature',
        state: {},
      },
    })

    expect(wrapper.text()).not.toContain('Sign here')
    expect(errors).toHaveBeenCalledWith(expect.stringContaining('webform_signature'))
    errors.mockRestore()
  })

  it('renders composite parts under their Drupal names', async () => {
    const organizer = canonical({
      '#type': 'webform_name',
      '#name': 'organizer',
      '#composite': {
        first: { '#type': 'textfield', '#name': 'first', '#title': 'First' },
        last: { '#type': 'textfield', '#name': 'last', '#title': 'Last', '#required': true },
      },
    } as unknown as WebformFieldProps)
    const state = createWebformState({ organizer })
    const wrapper = await mountSuspended(FieldRenderer, {
      props: { field: organizer, fieldName: 'organizer', state },
    })

    await wrapper.get('input[name="organizer.last"]').setValue('Lovelace')

    expect(state.organizer).toEqual({ first: '', last: 'Lovelace' })
  })

  it('answers each likert question under its key', async () => {
    const survey = canonical({
      '#type': 'webform_likert',
      '#name': 'survey',
      '#questions': { valueForMoney: 'Value for money' },
      '#questionKeys': ['value-for-money'],
      '#answers': { 1: 'Poor', 5: 'Great' },
    } as unknown as WebformFieldProps)
    const state = createWebformState({ survey })
    const wrapper = await mountSuspended(FieldRenderer, {
      props: { field: survey, fieldName: 'survey', state },
    })

    expect(wrapper.text()).toContain('Value for money')
    await wrapper.get('button[value="5"]').trigger('click')

    expect(state.survey).toEqual({ 'value-for-money': '5' })
  })

  it('collects several values for a multiple field', async () => {
    const attendees = canonical({ '#type': 'textfield', '#name': 'attendees', '#title': 'Attendees', '#multiple': 2 } as unknown as WebformFieldProps)
    const state = reactive(createWebformState({ attendees }))
    const wrapper = await mountSuspended(FieldRenderer, {
      props: { field: attendees, fieldName: 'attendees', state },
    })

    await wrapper.get('input').setValue('Ada')
    await wrapper.findAll('button').find(button => button.text() === 'Add another attendees')!.trigger('click')
    await wrapper.findAll('input')[1]!.setValue('Grace')

    expect(state.attendees).toEqual(['Ada', 'Grace'])
    // Drupal allows two, so no third.
    expect(wrapper.findAll('button').filter(button => button.text().startsWith('Add another'))).toHaveLength(0)
  })

  it('shows a field once a camel-cased legacy condition holds', async () => {
    const fee = canonical({
      '#type': 'textfield',
      '#name': 'ticket_fee',
      '#title': 'Ticket fee',
      '#states': { visible: { ':input[name="eventType"]': { value: 'paid_show' } } },
    })
    // The legacy selector resolves against the form's names.
    const fields = normalizeWebformDefinition({
      webformId: 'test',
      fields: {
        eventType: { '#type': 'radio', '#name': 'event_type', '#options': { paid_show: 'Paid' }, '#optionKeys': ['paid_show'] },
        ticketFee: fee,
      },
    }).fields
    const state = reactive<WebformState>({ event_type: '' })
    const wrapper = await mountSuspended(FieldRenderer, {
      props: { field: fields.ticket_fee!, fieldName: 'ticket_fee', state },
    })

    expect(wrapper.text()).not.toContain('Ticket fee')
    state.event_type = 'paid_show'
    await nextTick()
    expect(wrapper.text()).toContain('Ticket fee')
  })

  it('leaves a number with a minimum empty, without showing the minimum', async () => {
    // A required guest count: an empty box showing "1" looked answered.
    const guests = canonical({
      '#type': 'number',
      '#name': 'venue_guest_count',
      '#title': 'Guest Count',
      '#required': true,
      '#min': 1,
      '#max': 130,
    })
    const state = reactive(createWebformState({ venue_guest_count: guests }))
    const wrapper = await mountSuspended(FieldRenderer, {
      props: { field: guests, fieldName: 'venue_guest_count', state },
    })
    const input = wrapper.get('input')

    expect(input.element.value).toBe('')
    expect(input.attributes('placeholder') ?? '').toBe('')
    expect(state.venue_guest_count).toBe('')
  })

  it('shows the placeholder Drupal sets on a number', async () => {
    const guests = canonical({
      '#type': 'number',
      '#name': 'guests',
      '#min': 1,
      '#placeholder': 'How many guests?',
    })
    const wrapper = await mountSuspended(FieldRenderer, {
      props: { field: guests, fieldName: 'guests', state: reactive(createWebformState({ guests })) },
    })

    expect(wrapper.get('input').attributes('placeholder')).toBe('How many guests?')
  })

  it('rests a number\'s floating label on its border, as a select\'s does', async () => {
    const guests = canonical({
      '#type': 'number',
      '#name': 'guests',
      '#title': 'Estimated guest count',
      '#required': true,
      '#min': 1,
      '#max': 130,
      '#floatingLabel': true,
    })
    const state = reactive(createWebformState({ guests }))
    const wrapper = await mountSuspended(FieldRenderer, {
      props: { field: guests, fieldName: 'guests', state },
    })
    const labels = wrapper.findAll('label')
    const input = wrapper.get('input')

    expect(labels).toHaveLength(1)
    expect(labels[0]!.text()).toBe('Estimated guest count')
    expect(labels[0]!.attributes('for')).toBe(input.attributes('id'))
    expect(labels[0]!.classes()).toEqual(expect.arrayContaining(useStirWebformTheme().labels.staticFloatingClass.join(' ').split(' ')))
    expect(input.attributes('aria-required')).toBe('true')
    expect(input.element.value).toBe('')
    expect(input.attributes('placeholder') ?? '').toBe('')
    expect(wrapper.findAll('button')).toHaveLength(2)
  })
})
