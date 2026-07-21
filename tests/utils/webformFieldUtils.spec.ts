import { describe, expect, it } from 'vitest'
import { normalizeWebformDefinition } from '../../layers/webform/app/utils/webformFieldUtils'

describe('normalizeWebformDefinition', () => {
  it('adapts legacy wire values once into the canonical contract', () => {
    const webform = normalizeWebformDefinition({
      webformId: 'contact',
      fields: {
        eventDate: {
          '#type': 'number',
          '#name': 'event_date',
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

    expect(webform.fields.event_date).toMatchObject({
      '#name': 'event_date',
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
    expect(webform.fields.event_date).not.toHaveProperty('#default_value')
    expect(webform.fields.enabled?.['#defaultValue']).toBe(true)
    expect(webform.actions[0]?.['#submitLabel']).toBe('Send')
  })

  it('uses Drupal #name as the canonical field key', () => {
    const webform = normalizeWebformDefinition({
      schemaVersion: 1,
      fields: {
        eventDetails: {
          '#type': 'section',
          '#name': 'event_details',
          children: {
            partnerName_1: {
              '#type': 'textfield',
              '#name': 'partner_name_1',
            },
          },
        },
      },
    })

    expect(Object.keys(webform.fields)).toEqual(['event_details'])
    expect(Object.keys(webform.fields.event_details?.children ?? {})).toEqual([
      'partner_name_1',
    ])
  })

  it('restores Drupal option machine names changed by Custom Elements', () => {
    const webform = normalizeWebformDefinition({
      schemaVersion: 1,
      fields: {
        dinnerAppetizers: {
          '#type': 'checkboxes',
          '#name': 'dinner_appetizers',
          '#optionKeys': ['mini_meatballs', 'chef-Special'],
          '#options': {
            miniMeatballs: 'Mini Meatballs',
            chefSpecial: 'Chef Special',
          },
          '#optionProperties': {
            miniMeatballs: { price: 6 },
            chefSpecial: { price: 8 },
          },
        },
      },
    })

    expect(webform.fields.dinner_appetizers?.['#options']).toEqual({
      mini_meatballs: 'Mini Meatballs',
      'chef-Special': 'Chef Special',
    })
    expect(webform.fields.dinner_appetizers?.['#optionProperties']).toEqual({
      mini_meatballs: { price: 6 },
      'chef-Special': { price: 8 },
    })
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
