import { describe, expect, it } from 'vitest'
import { normalizeWebformDefinition } from '../../layers/webform/app/utils/webformFieldUtils'
import { flattenWebformFields } from '../../layers/webform/app/utils/flattenWebformFields'

describe('flattenWebformFields', () => {
  it('submits container children under their Drupal names', () => {
    // Custom Elements camel-cases nested keys; `#name` keeps the Drupal key.
    const definition = normalizeWebformDefinition({
      webformId: 'submit_event',
      fields: {
        eventDetails: {
          '#type': 'fieldset',
          '#name': 'event_details',
          children: {
            eventName: { '#type': 'textfield', '#name': 'event_name', '#required': true },
            datesTimes: { '#type': 'textarea', '#name': 'dates_times' },
          },
        },
        row: {
          '#type': 'webform_flexbox',
          '#name': 'row',
          children: {
            phoneNumber: { '#type': 'tel', '#name': 'phone_number' },
          },
        },
      },
    })

    const flat = flattenWebformFields(definition.fields)

    expect(Object.keys(flat)).toEqual(['event_name', 'dates_times', 'phone_number'])
  })
})
