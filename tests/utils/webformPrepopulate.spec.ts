import { describe, expect, it } from 'vitest'
import { applyWebformPrepopulate, createWebformState } from '../../layers/webform/app/utils/webformState'
import type { WebformFieldProps } from '../../layers/theme/app/types/Form'

const fields = {
  space: { '#type': 'radio', '#name': 'space', '#prepopulate': true, '#options': { 12: 'Warehouse', 11: 'Garage' } },
  topics: { '#type': 'checkboxes', '#name': 'topics', '#prepopulate': true, '#options': { a: 'A', b: 'B' } },
  name: { '#type': 'textfield', '#name': 'name', '#prepopulate': true },
  email: { '#type': 'email', '#name': 'email' },
} as unknown as Record<string, WebformFieldProps>

describe('applyWebformPrepopulate', () => {
  it('fills fields that allow it from the URL', () => {
    const state = createWebformState(fields)

    applyWebformPrepopulate(state, fields, { space: '12', topics: ['a', 'b'], name: 'Ada', email: 'ada@example.com' })
    expect(state).toMatchObject({ space: '12', topics: ['a', 'b'], name: 'Ada', email: '' })
  })

  it('takes only a listed option', () => {
    const state = createWebformState(fields)

    applyWebformPrepopulate(state, fields, { space: '99', topics: ['a', 'z'] })
    expect(state).toMatchObject({ space: '', topics: ['a'] })
  })
})
