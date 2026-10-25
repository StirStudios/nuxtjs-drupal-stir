import { describe, expect, it } from 'vitest'
import { flattenWebformFields } from '../../layers/webform/app/utils/flattenWebformFields'
import { resolveWizardPages, wizardPageFieldNames } from '../../layers/webform/app/utils/webformWizard'
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
      path: { '#type': 'radios', '#name': 'path', '#required': true },
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
    },
  },
} as unknown as Record<string, WebformFieldProps>)
const names = Object.keys(fields)

describe('wizard pages', () => {
  it('flattens page fields without making the page a visual group', () => {
    expect(names).toEqual(['path', 'space', 'day', 'notes'])
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

  it('lists the fields on one page', () => {
    expect(wizardPageFieldNames(fields, names, 'when')).toEqual(['space', 'day'])
    expect(wizardPageFieldNames(fields, names, undefined)).toEqual([])
  })
})
