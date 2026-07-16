import { describe, expect, it } from 'vitest'
import { parse, parseAsync } from 'valibot'
import { buildValidationSchema } from '../../layers/webform/app/utils/buildValidationSchema'
import type { WebformFieldProps, WebformState } from '../../layers/theme/app/types'

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
  it('enforces required multiple datetime count from API', async () => {
    const fields: Record<string, WebformFieldProps> = {
      eventDate: createDateTimeField({
        '#required': true,
        '#multiple': 3,
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
    const fields: Record<string, WebformFieldProps> = {
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
    }
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
        contactEmail: 'team@example.com',
      }),
    ).resolves.toBeTruthy()
  })

  it('does not validate hidden required datetime fields until they become visible', async () => {
    const fields: Record<string, WebformFieldProps> = {
      showDates: {
        '#type': 'text',
        '#title': 'Show Dates',
        '#name': 'show_dates',
      },
      eventDate: createDateTimeField({
        '#required': true,
        '#multiple': 3,
        '#states': {
          visible: {
            ':input[name="showDates"]': { value: 'yes' },
          },
        },
      }),
    }
    const state: WebformState = { showDates: 'no' }

    const hiddenSchema = buildValidationSchema(fields, state)

    await expect(parseAsync(hiddenSchema, { showDates: 'no' })).resolves.toBeTruthy()

    state.showDates = 'yes'
    const visibleSchema = buildValidationSchema(fields, state)

    await expect(parseAsync(visibleSchema, { showDates: 'yes' })).rejects.toBeTruthy()

    await expect(
      parseAsync(visibleSchema, {
        showDates: 'yes',
        eventDate: [
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
})
