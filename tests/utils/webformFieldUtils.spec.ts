import { describe, expect, it } from 'vitest'
import {
  resolveWebformBoolean,
  resolveWebformCardinality,
  resolveWebformFieldType,
  resolveWebformMultiple,
} from '../../layers/webform/app/utils/webformFieldUtils'
import type { WebformFieldProps } from '../../layers/theme/app/types'

const field = (
  overrides: Partial<WebformFieldProps> = {},
): WebformFieldProps => ({
  '#type': 'text',
  '#title': 'Field',
  '#name': 'field',
  ...overrides,
})

describe('webformFieldUtils', () => {
  it.each([
    [true, true],
    [1, true],
    ['1', true],
    ['true', true],
    [false, false],
    [0, false],
    ['0', false],
    ['false', false],
    [undefined, false],
  ])('normalizes Drupal boolean value %s', (value, expected) => {
    expect(resolveWebformBoolean(value)).toBe(expected)
  })

  it('normalizes numeric and boolean cardinality values', () => {
    expect(resolveWebformCardinality('3')).toBe(3)
    expect(resolveWebformCardinality('0')).toBe(1)
    expect(resolveWebformCardinality(true)).toBe(1)
    expect(resolveWebformMultiple('3')).toBe(true)
    expect(resolveWebformMultiple('1')).toBe(true)
    expect(resolveWebformMultiple(1)).toBe(false)
    expect(resolveWebformMultiple('0')).toBe(false)
  })

  it('normalizes range aliases once for renderer and state setup', () => {
    expect(
      resolveWebformFieldType({
        ...field(),
        '#type': 'webform_range',
      } as unknown as WebformFieldProps),
    ).toBe('range')
    expect(
      resolveWebformFieldType(
        field({ '#type': 'number', '#input_type': 'range' }),
      ),
    ).toBe('range')
  })
})
