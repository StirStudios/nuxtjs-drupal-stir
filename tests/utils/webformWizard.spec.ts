import { describe, expect, it } from 'vitest'
import { flattenWebformFields } from '../../layers/webform/app/utils/flattenWebformFields'
import { hasLaterWizardPage, resolveWizardPages, wizardChoiceField, wizardPageFieldNames } from '../../layers/webform/app/utils/webformWizard'
import type { WebformFieldProps } from '../../layers/theme/app/types/Form'

// A booking-style wizard: a chooser page, then pages shown only for one path.
const onlyFor = (value: string) => ({
  '#states': { visible: { ':input[name="path"]': { value } } },
  '#conditions': [{
    state: 'visible',
    logic: 'and',
    rules: [{ name: 'path', selector: ':input[name="path"]', triggers: [{ trigger: 'value', value }] }],
  }],
})

const fields = flattenWebformFields({
  start: {
    '#type': 'webform_wizard_page',
    '#name': 'start',
    '#title': 'Start',
    children: {
      path: { '#type': 'radio', '#name': 'path', '#required': true },
    },
  },
  when: {
    '#type': 'webform_wizard_page',
    '#name': 'when',
    '#title': 'Space and time',
    '#nextButtonLabel': 'Choose a time',
    children: {
      space: { '#type': 'select', '#name': 'space', ...onlyFor('book') },
      day: { '#type': 'date', '#name': 'day', ...onlyFor('book') },
    },
  },
  inquiry: {
    '#type': 'webform_wizard_page',
    '#name': 'inquiry',
    '#title': 'Your project',
    children: {
      notes: { '#type': 'textarea', '#name': 'notes', ...onlyFor('info') },
      useType: { '#type': 'select', '#name': 'use_type', ...onlyFor('info') },
      // As Custom Elements sends it: camel-cased `#states`, machine names in
      // `#conditions`.
      insurance: {
        '#type': 'select',
        '#name': 'insurance',
        '#states': { visible: { ':input[name="useType"]': { value: 'event' }, ':input[name="path"]': { value: 'info' } } },
        '#conditions': [
          { state: 'visible', logic: 'and', rules: [{ name: 'use_type', selector: ':input[name="use_type"]', triggers: [{ trigger: 'value', value: 'event' }] }] },
          { state: 'visible', logic: 'and', rules: [{ name: 'path', selector: ':input[name="path"]', triggers: [{ trigger: 'value', value: 'info' }] }] },
        ],
      },
    },
  },
} as unknown as Record<string, WebformFieldProps>)
const names = Object.keys(fields)

describe('wizard pages', () => {
  it('flattens page fields without making the page a visual group', () => {
    expect(names).toEqual(['path', 'space', 'day', 'notes', 'useType', 'insurance'])
    expect(fields.space?.parent).toBeNull()
    expect(fields.space?.page).toEqual({ key: 'when', title: 'Space and time', prevLabel: null, nextLabel: 'Choose a time' })
  })

  it('leaves fields outside wizard pages without a page', () => {
    const plain = flattenWebformFields({ name: { '#type': 'textfield', '#name': 'name' } } as unknown as Record<string, WebformFieldProps>)

    expect(plain.name?.page).toBeNull()
    expect(resolveWizardPages(plain, ['name'], {})).toEqual([])
  })

  it('skips pages whose fields are hidden by conditions', () => {
    expect(resolveWizardPages(fields, names, { path: 'book' }).map((page) => page.key)).toEqual(['start', 'when'])
    expect(resolveWizardPages(fields, names, { path: 'info' }).map((page) => page.key)).toEqual(['start', 'inquiry'])
    expect(resolveWizardPages(fields, names, { path: '' }).map((page) => page.key)).toEqual(['start'])
  })

  it('knows a hidden page still comes after the chooser', () => {
    expect(hasLaterWizardPage(fields, names, 'start', {})).toBe(true)
    expect(hasLaterWizardPage(fields, names, 'inquiry', { path: 'info' })).toBe(false)
    expect(hasLaterWizardPage(fields, names, undefined, {})).toBe(false)
  })

  it('drops a later page the chosen path hides, so the last page submits', () => {
    expect(hasLaterWizardPage(fields, names, 'start', { path: 'book' })).toBe(true)
    expect(hasLaterWizardPage(fields, names, 'when', { path: 'book' })).toBe(false)
    expect(hasLaterWizardPage(fields, names, 'when', { path: '' })).toBe(true)
    // A later field that also waits on an unanswered question stays hidden
    // once the path is chosen.
    expect(hasLaterWizardPage(fields, names, 'when', { path: 'book', use_type: '' })).toBe(false)
  })

  it('finds the single radio question a page asks', () => {
    expect(wizardChoiceField(fields, names, 'start')).toBe('path')
    expect(wizardChoiceField(fields, names, 'when')).toBeUndefined()
  })

  it('lists the fields on one page', () => {
    expect(wizardPageFieldNames(fields, names, 'when')).toEqual(['space', 'day'])
    expect(wizardPageFieldNames(fields, names, undefined)).toEqual([])
  })

  it('keeps the flexbox row of fields that render side by side', () => {
    const row = flattenWebformFields({
      contact: {
        '#type': 'webform_flexbox',
        '#name': 'contact',
        children: {
          name: { '#type': 'textfield', '#name': 'name' },
          email: { '#type': 'email', '#name': 'email' },
        },
      },
      notes: { '#type': 'textarea', '#name': 'notes' },
    } as unknown as Record<string, WebformFieldProps>)

    expect(Object.keys(row)).toEqual(['name', 'email', 'notes'])
    expect([row.name?.row, row.email?.row, row.notes?.row]).toEqual(['contact', 'contact', undefined])
  })
})
