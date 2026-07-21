import { describe, expect, it } from 'vitest'
import { normalizeWebformDefinition } from '../../layers/webform/app/utils/webformFieldUtils'

describe('normalizeWebformDefinition', () => {
  it('adapts legacy wire values once into the canonical contract', () => {
    const webform = normalizeWebformDefinition({
      webformId: 'contact',
      fields: {
        eventDate: {
          '#type': 'number',
          '#required': '1',
          '#multiple': '3',
          '#default_value': ['2026-07-20'],
          '#input_type': 'range',
          '#option_properties': {
            chef_special: {
              alreadyCamel: 'preserved',
              check_against: 'guestCount',
              linked_to: ['basePackage'],
            },
          },
        },
        enabled: {
          '#type': 'checkbox',
          '#default_value': '1',
        },
      },
      actions: [{ '#type': 'webform_actions', '#submit__label': 'Send' }],
    })

    expect(webform.fields.eventDate).toMatchObject({
      '#name': 'eventDate',
      '#required': true,
      '#multiple': true,
      '#cardinality': 3,
      '#defaultValue': ['2026-07-20'],
      '#type': 'range',
      '#optionProperties': {
        chef_special: {
          alreadyCamel: 'preserved',
          checkAgainst: 'guestCount',
          linkedTo: ['basePackage'],
        },
      },
    })
    expect(webform.fields.eventDate).not.toHaveProperty('#default_value')
    expect(webform.fields.enabled?.['#defaultValue']).toBe(true)
    expect(webform.actions[0]?.['#submitLabel']).toBe('Send')
  })

  it('rejects unsupported contract versions at the boundary', () => {
    expect(() => normalizeWebformDefinition({ schemaVersion: 2 })).toThrow(
      'Unsupported webform schema version: 2',
    )
  })

  it('drops malformed fields before components consume the payload', () => {
    const webform = normalizeWebformDefinition({
      schemaVersion: 1,
      fields: {
        validName: { '#type': 'textfield' },
        missingType: { '#title': 'Invalid' },
        scalar: 'invalid',
      },
      actions: [{ '#type': 'submit' }, { '#title': 'Invalid' }, 'invalid'],
    })

    expect(webform.fields).toEqual({
      validName: {
        '#name': 'validName',
        '#type': 'textfield',
      },
    })
    expect(webform.actions).toEqual([{ '#type': 'submit' }])
  })
})
