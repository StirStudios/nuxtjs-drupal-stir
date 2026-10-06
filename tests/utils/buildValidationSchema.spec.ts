import { describe, expect, it } from 'vitest'
import { parse, parseAsync } from 'valibot'
import { buildValidationSchema } from '../../layers/webform/app/utils/buildValidationSchema'
import { normalizeWebformDefinition } from '../../layers/webform/app/utils/webformFieldUtils'
import type { WebformFieldProps, WebformState } from '../../layers/theme/app/types'

// Fields reach validation through the payload boundary, which turns
// `#states` into `#conditions` and keys fields by their Drupal names.
function normalizeFields(
  fields: Record<string, WebformFieldProps>,
): Record<string, WebformFieldProps> {
  return normalizeWebformDefinition({ webformId: 'test', fields }).fields
}

function createDateTimeField(
  overrides: Partial<WebformFieldProps> = {},
): WebformFieldProps {
  return {
    '#type': 'datetime',
    '#title': 'Event Date',
    '#name': 'event_date',
    ...overrides,
  }
}

describe('buildValidationSchema', () => {
  it('excludes display-only elements from validation output', () => {
    const fields: Record<string, WebformFieldProps> = {
      notice: {
        '#type': 'webform_markup',
        '#name': 'notice',
        '#markup': '<p>Privacy notice</p>',
      },
      name: {
        '#type': 'textfield',
        '#name': 'name',
      },
    }

    expect(parse(buildValidationSchema(fields, {}), {
      notice: '',
      name: 'Alex',
    })).toEqual({ name: 'Alex' })
  })

  it('enforces required multiple datetime count from API', async () => {
    const fields: Record<string, WebformFieldProps> = {
      eventDate: createDateTimeField({
        '#required': true,
        '#multiple': true,
        '#cardinality': 3,
      }),
    }
    const state: WebformState = {}
    const schema = buildValidationSchema(fields, state)

    await expect(
      parseAsync(schema, {
        eventDate: [
          '2026-02-19T10:30:00-0800',
          '2026-02-20T10:30:00-0800',
        ],
      }),
    ).rejects.toBeTruthy()

    await expect(
      parseAsync(schema, {
        eventDate: [
          '2026-02-19T10:30:00-0800',
          '2026-02-20T10:30:00-0800',
          '2026-02-21T10:30:00-0800',
        ],
      }),
    ).resolves.toBeTruthy()
  })

  it('returns cached schema when visibility signature is unchanged', () => {
    const fields: Record<string, WebformFieldProps> = {
      firstName: {
        '#type': 'text',
        '#title': 'First name',
        '#name': 'first_name',
        '#required': true,
      },
    }
    const state: WebformState = {}

    const schemaOne = buildValidationSchema(fields, state)

    state.unrelated = 'changed'
    const schemaTwo = buildValidationSchema(fields, state)

    expect(schemaTwo).toBe(schemaOne)
  })

  it('rebuilds schema when visibility changes and enforces newly visible required fields', async () => {
    const fields = normalizeFields({
      mode: {
        '#type': 'text',
        '#title': 'Mode',
        '#name': 'mode',
      },
      contactEmail: {
        '#type': 'email',
        '#title': 'Contact Email',
        '#name': 'contact_email',
        '#required': true,
        '#states': {
          visible: {
            ':input[name="mode"]': { value: 'email' },
          },
        },
      },
    })
    const state: WebformState = { mode: 'none' }

    const hiddenSchema = buildValidationSchema(fields, state)

    await expect(parseAsync(hiddenSchema, { mode: 'none' })).resolves.toBeTruthy()

    state.mode = 'email'
    const visibleSchema = buildValidationSchema(fields, state)

    expect(visibleSchema).not.toBe(hiddenSchema)

    await expect(parseAsync(visibleSchema, { mode: 'email' })).rejects.toBeTruthy()
    await expect(
      parseAsync(visibleSchema, {
        mode: 'email',
        contact_email: 'team@example.com',
      }),
    ).resolves.toBeTruthy()
  })

  it('does not validate hidden required datetime fields until they become visible', async () => {
    // The selector arrives camel-cased, as Custom Elements sends #states.
    const fields = normalizeFields({
      showDates: {
        '#type': 'text',
        '#title': 'Show Dates',
        '#name': 'show_dates',
      },
      eventDate: createDateTimeField({
        '#required': true,
        '#multiple': true,
        '#cardinality': 3,
        '#states': {
          visible: {
            ':input[name="showDates"]': { value: 'yes' },
          },
        },
      }),
    })
    const state: WebformState = { show_dates: 'no' }

    const hiddenSchema = buildValidationSchema(fields, state)

    await expect(parseAsync(hiddenSchema, { show_dates: 'no' })).resolves.toBeTruthy()

    state.show_dates = 'yes'
    const visibleSchema = buildValidationSchema(fields, state)

    await expect(parseAsync(visibleSchema, { show_dates: 'yes' })).rejects.toBeTruthy()

    await expect(
      parseAsync(visibleSchema, {
        show_dates: 'yes',
        event_date: [
          '2026-02-19T10:30:00-0800',
          '2026-02-20T10:30:00-0800',
          '2026-02-21T10:30:00-0800',
        ],
      }),
    ).resolves.toBeTruthy()
  })

  it('validates tel field format and rejects alphabetic characters', async () => {
    const fields: Record<string, WebformFieldProps> = {
      contactPhone: {
        '#type': 'tel',
        '#title': 'Phone',
        '#name': 'contact_phone',
        '#required': true,
      },
    }
    const schema = buildValidationSchema(fields, {})

    await expect(
      parseAsync(schema, {
        contactPhone: '(555) 111-2222',
      }),
    ).resolves.toBeTruthy()

    await expect(
      parseAsync(schema, {
        contactPhone: '555-ABC-2222',
      }),
    ).rejects.toBeTruthy()
  })

  it('allows optional tel fields to be submitted empty', async () => {
    const fields: Record<string, WebformFieldProps> = {
      contactPhone: {
        '#type': 'tel',
        '#title': 'Phone',
        '#name': 'contact_phone',
        '#required': false,
      },
    }
    const schema = buildValidationSchema(fields, {})

    await expect(
      parseAsync(schema, {
        contactPhone: '',
      }),
    ).resolves.toBeTruthy()
  })

  it('enforces numeric min and max bounds', async () => {
    const fields: Record<string, WebformFieldProps> = {
      guestCount: {
        '#type': 'number',
        '#title': 'Guest Count',
        '#name': 'guest_count',
        '#required': true,
        '#min': 2,
        '#max': 4,
      },
    }
    const schema = buildValidationSchema(fields, {})

    expect(() => parse(schema, { guestCount: 1 })).toThrow()
    expect(() => parse(schema, { guestCount: 5 })).toThrow()
    expect(parse(schema, { guestCount: 3 })).toBeTruthy()
  })

  it('allows optional number fields to be submitted empty', async () => {
    const fields: Record<string, WebformFieldProps> = {
      guestCount: {
        '#type': 'number',
        '#title': 'Guest Count',
        '#name': 'guest_count',
        '#required': false,
        '#min': 2,
        '#max': 4,
      },
    }
    const schema = buildValidationSchema(fields, {})

    expect(parse(schema, { guestCount: '' })).toBeTruthy()
  })

  it('requires checkbox fields to be true when required', async () => {
    const fields: Record<string, WebformFieldProps> = {
      terms: {
        '#type': 'checkbox',
        '#title': 'Accept Terms',
        '#name': 'terms',
        '#required': true,
      },
    }
    const schema = buildValidationSchema(fields, {})

    expect(() => parse(schema, { terms: false })).toThrow()
    expect(parse(schema, { terms: true })).toBeTruthy()
  })

  it('enforces checkboxes min and max selection', async () => {
    const fields: Record<string, WebformFieldProps> = {
      interests: {
        '#type': 'checkboxes',
        '#title': 'Interests',
        '#name': 'interests',
        '#required': true,
        '#minSelected': 2,
        '#maxSelected': 3,
      },
    }
    const schema = buildValidationSchema(fields, {})

    expect(() => parse(schema, { interests: ['a'] })).toThrow()
    expect(() => parse(schema, { interests: ['a', 'b', 'c', 'd'] })).toThrow()
    expect(parse(schema, { interests: ['a', 'b'] })).toBeTruthy()
  })

  it('enforces only the number bounds Drupal sets', () => {
    const fields: Record<string, WebformFieldProps> = {
      children: { '#type': 'number', '#name': 'children' },
      guests: { '#type': 'number', '#name': 'guests', '#min': 1, '#max': 10 },
    }
    const schema = buildValidationSchema(fields, {})

    expect(() => parse(schema, { children: 0, guests: 1 })).not.toThrow()
    expect(() => parse(schema, { children: 0, guests: 0 })).toThrow('Minimum value is 1')
    expect(() => parse(schema, { children: 0, guests: 11 })).toThrow('Maximum value is 10')
  })

  it('requires only the composite parts Webform requires', () => {
    const fields: Record<string, WebformFieldProps> = {
      venue: {
        '#type': 'address',
        '#name': 'venue',
        // Display only: Webform enforces each part's own #required.
        '#required': true,
        '#composite': {
          city: { '#type': 'textfield', '#name': 'city', '#required': true },
          address_2: { '#type': 'textfield', '#name': 'address_2' },
        },
      },
    }
    const schema = buildValidationSchema(fields, {})

    expect(() => parse(schema, { venue: { city: 'Springfield', address_2: '' } })).not.toThrow()
    expect(() => parse(schema, { venue: { city: '', address_2: 'Unit 4' } })).toThrow()
  })

  it('validates each row of a composite that takes several values', () => {
    const fields: Record<string, WebformFieldProps> = {
      lineup: {
        '#type': 'webform_custom_composite' as never,
        '#name': 'lineup',
        '#multiple': true,
        '#composite': {
          performer: { '#type': 'textfield', '#name': 'performer', '#required': true },
        },
      },
    }
    const schema = buildValidationSchema(fields, {})

    expect(() => parse(schema, { lineup: [{ performer: 'The Steps' }] })).not.toThrow()
    expect(() => parse(schema, { lineup: [{ performer: '' }] })).toThrow()
  })

  it('requires an answer to every likert question when required', () => {
    const fields: Record<string, WebformFieldProps> = {
      survey: {
        '#type': 'webform_likert',
        '#name': 'survey',
        '#required': true,
        '#questions': { service: 'Service', value: 'Value' },
        '#answers': { 1: 'Bad', 5: 'Good' },
      },
    }
    const schema = buildValidationSchema(fields, {})

    expect(() => parse(schema, { survey: { service: '5', value: '1' } })).not.toThrow()
    expect(() => parse(schema, { survey: { service: '5' } })).toThrow('Please answer every question')
  })

  it('counts only filled values of a multiple field', () => {
    const fields: Record<string, WebformFieldProps> = {
      names: { '#type': 'textfield', '#name': 'names', '#multiple': true, '#required': true },
    }
    const schema = buildValidationSchema(fields, {})

    expect(() => parse(schema, { names: ['Ada'] })).not.toThrow()
    expect(() => parse(schema, { names: [''] })).toThrow()
  })

  it('leaves an element type the layer cannot show to Drupal', () => {
    const fields: Record<string, WebformFieldProps> = {
      signature: { '#type': 'webform_signature' as never, '#name': 'signature', '#required': true },
    }

    expect(() => parse(buildValidationSchema(fields, {}), {})).not.toThrow()
  })
})
