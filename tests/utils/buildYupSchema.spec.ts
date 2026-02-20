import { describe, expect, it } from 'vitest'
import { buildYupSchema } from '../../app/utils/buildYupSchema'
import type { WebformFieldProps, WebformState } from '../../types'

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

describe('buildYupSchema', () => {
  it('enforces required multiple datetime count from API', async () => {
    const fields: Record<string, WebformFieldProps> = {
      eventDate: createDateTimeField({
        '#required': true,
        '#multiple': 3,
      }),
    }
    const state: WebformState = {}
    const schema = buildYupSchema(fields, state)

    await expect(
      schema.validate({
        eventDate: [
          '2026-02-19T10:30:00-0800',
          '2026-02-20T10:30:00-0800',
        ],
      }),
    ).rejects.toBeTruthy()

    await expect(
      schema.validate({
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

    const schemaOne = buildYupSchema(fields, state)

    state.unrelated = 'changed'
    const schemaTwo = buildYupSchema(fields, state)

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

    const hiddenSchema = buildYupSchema(fields, state)

    await expect(hiddenSchema.validate({ mode: 'none' })).resolves.toBeTruthy()

    state.mode = 'email'
    const visibleSchema = buildYupSchema(fields, state)

    expect(visibleSchema).not.toBe(hiddenSchema)

    await expect(visibleSchema.validate({ mode: 'email' })).rejects.toBeTruthy()
    await expect(
      visibleSchema.validate({
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

    const hiddenSchema = buildYupSchema(fields, state)

    await expect(hiddenSchema.validate({ showDates: 'no' })).resolves.toBeTruthy()

    state.showDates = 'yes'
    const visibleSchema = buildYupSchema(fields, state)

    await expect(visibleSchema.validate({ showDates: 'yes' })).rejects.toBeTruthy()

    await expect(
      visibleSchema.validate({
        showDates: 'yes',
        eventDate: [
          '2026-02-19T10:30:00-0800',
          '2026-02-20T10:30:00-0800',
          '2026-02-21T10:30:00-0800',
        ],
      }),
    ).resolves.toBeTruthy()
  })
})
