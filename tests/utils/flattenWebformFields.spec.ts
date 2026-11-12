import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
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

  it('stacks a container\'s fields in one column of a flexbox row', () => {
    const definition = normalizeWebformDefinition({
      webformId: 'booking',
      fields: {
        row: {
          '#type': 'webform_flexbox',
          '#name': 'row',
          children: {
            choices: {
              '#type': 'webform_container',
              '#name': 'choices',
              children: {
                room: { '#type': 'select', '#name': 'room' },
                length: { '#type': 'select', '#name': 'length' },
              },
            },
            day: { '#type': 'date', '#name': 'day' },
          },
        },
      },
    })

    const flat = flattenWebformFields(definition.fields)

    expect(Object.keys(flat)).toEqual(['room', 'length', 'day'])
    expect(flat.room).toMatchObject({ row: 'row', column: 'choices' })
    expect(flat.length).toMatchObject({ row: 'row', column: 'choices' })
    expect(flat.day?.row).toBe('row')
    expect(flat.day?.column).toBeUndefined()
  })

  it('submits the event fixture under the names Drupal stores', () => {
    // The Stir Tools fixture is the wire shape after Custom Elements has
    // camel-cased every nested key. Submission must use Drupal's names.
    const fixture = JSON.parse(readFileSync(
      resolve(__dirname, '../../contracts/stir-tools/v1/fixtures/webform-event.json'),
      'utf8',
    ))
    const flat = flattenWebformFields(normalizeWebformDefinition(fixture).fields)

    expect(Object.keys(flat)).toEqual(['event_name', 'dates_times', 'event_location', 'double_check'])
    const address = flat.event_location?.['#composite'] as Record<string, { '#required'?: boolean }>

    expect(Object.keys(address)).toEqual(['city', 'state_province', 'postal_code', 'country'])
    expect(address.city?.['#required']).toBe(true)
  })
})
