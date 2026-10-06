import { describe, expect, it } from 'vitest'
import type { WebformFieldProps, WebformStateCondition } from '../../layers/theme/app/types'
import {
  evaluateConditionGroup,
  getConditionValue,
  resolveWebformFieldStates,
} from '../../layers/webform/app/utils/webformConditions'

const rule = (name: string | null, trigger: string, value: unknown = true) => ({
  name,
  selector: `:input[name="${name}"]`,
  triggers: [{ trigger, value }],
})

const field = (conditions: WebformStateCondition[], extra: Partial<WebformFieldProps> = {}): WebformFieldProps => ({
  '#type': 'textfield',
  '#name': 'target',
  '#conditions': conditions,
  ...extra,
})

describe('webform conditions', () => {
  it('reads checkbox options, composite parts and checkboxes as Drupal does', () => {
    const state = { extras: ['early_bird'], venue: { city: 'Springfield' }, agree: true, opt_out: false }

    expect(getConditionValue(state, 'extras.early_bird')).toBe('early_bird')
    expect(getConditionValue(state, 'extras.late_entry')).toBe('')
    expect(getConditionValue(state, 'venue.city')).toBe('Springfield')
    expect(getConditionValue(state, 'agree')).toBe(1)
    expect(getConditionValue(state, 'opt_out')).toBe(0)
  })

  it.each([
    ['checked', true, true, true],
    ['checked', true, false, false],
    ['unchecked', true, false, true],
    ['empty', true, '', true],
    ['empty', true, '0', false],
    ['filled', true, 'x', true],
    ['value', 'paid', 'paid', true],
    ['value', '1', true, true],
    ['!value', 'paid', 'free', true],
    ['pattern', '^U', 'United States', true],
    ['!pattern', '^U', 'Canada', true],
    ['less', 5, 3, true],
    ['less_equal', 5, 5, true],
    ['greater', 5, 5, false],
    ['greater_equal', 5, 5, true],
    ['between', '1:5', 3, true],
    ['between', '1:5', 6, false],
    ['value', 'b', ['a', 'b'], true],
    ['empty', true, [], true],
  ])('%s %j against %j is %s', (trigger, triggerValue, value, expected) => {
    expect(evaluateConditionGroup({ logic: 'and', rules: [rule('source', trigger, triggerValue)] }, { source: value as never })).toBe(expected)
  })

  it('combines rules with and, or and xor', () => {
    const state = { a: 'yes', b: 'no' }
    const rules = [rule('a', 'value', 'yes'), rule('b', 'value', 'yes')]

    expect(evaluateConditionGroup({ logic: 'and', rules }, state)).toBe(false)
    expect(evaluateConditionGroup({ logic: 'or', rules }, state)).toBe(true)
    expect(evaluateConditionGroup({ logic: 'xor', rules }, state)).toBe(true)
  })

  it('ignores a condition naming a field the form does not have, as Drupal does', () => {
    const target = field([{ state: 'visible', logic: 'and', rules: [rule('missing', 'checked')] }])

    expect(resolveWebformFieldStates(target, {}).visible).toBe(true)
    expect(evaluateConditionGroup({ logic: 'and', rules: [rule(null, 'checked')] }, {})).toBeNull()
  })

  it('requires every visibility condition, including a container\'s', () => {
    const target = field([
      { state: 'visible', logic: 'and', rules: [rule('own', 'checked')] },
      { state: 'invisible', logic: 'and', rules: [rule('container', 'checked')] },
    ])

    expect(resolveWebformFieldStates(target, { own: true, container: false }).visible).toBe(true)
    expect(resolveWebformFieldStates(target, { own: true, container: true }).visible).toBe(false)
  })

  it('lets conditions decide required, optional, disabled and checked', () => {
    const target = field([
      { state: 'optional', logic: 'and', rules: [rule('skip', 'checked')] },
      { state: 'enabled', logic: 'and', rules: [rule('unlock', 'checked')] },
      { state: 'checked', logic: 'and', rules: [rule('all', 'checked')] },
    ], { '#required': true })

    expect(resolveWebformFieldStates(target, { skip: false, unlock: true, all: true })).toEqual({
      visible: true,
      required: true,
      disabled: false,
      readonly: false,
      checked: true,
    })
    expect(resolveWebformFieldStates(target, { skip: true, unlock: false, all: false })).toMatchObject({
      required: false,
      disabled: true,
      checked: false,
    })
  })

  it('keeps a field\'s own properties without conditions', () => {
    expect(resolveWebformFieldStates(field([], { '#required': true, '#disabled': true }), {})).toEqual({
      visible: true,
      required: true,
      disabled: true,
      readonly: false,
      checked: undefined,
    })
  })
})
