import { describe, expect, it } from 'vitest'
import { isWebformDisplayElement } from '../../layers/webform/app/utils/webformDisplayUtils'

describe('isWebformDisplayElement', () => {
  it.each([
    'processed_text',
    'webform_markup',
  ] as const)('recognizes %s as display-only', (type) => {
    expect(isWebformDisplayElement({ '#type': type })).toBe(true)
  })

  it('keeps input elements in form state', () => {
    expect(isWebformDisplayElement({ '#type': 'checkbox' })).toBe(false)
  })
})
