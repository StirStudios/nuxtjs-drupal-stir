import { describe, expect, it } from 'vitest'
import { resolveResponsiveGridValue } from '../../layers/theme/app/utils/responsiveGrid'

describe('resolveResponsiveGridValue', () => {
  const values = {
    default: 1,
    xs: 2,
    sm: 3,
    md: 4,
    lg: 5,
    xl: 6,
    '2xl': 7,
  }

  it.each([
    [320, 1],
    [480, 2],
    [640, 3],
    [768, 4],
    [1024, 5],
    [1280, 6],
    [1536, 7],
    [1920, 7],
  ])('inherits the active value at a %ipx viewport', (width, expected) => {
    expect(resolveResponsiveGridValue(values, width, 9)).toBe(expected)
  })

  it('inherits earlier values and preserves an explicit zero gap', () => {
    expect(resolveResponsiveGridValue({ default: 0, lg: 32 }, 768, 16)).toBe(0)
    expect(resolveResponsiveGridValue({ default: 0, lg: 32 }, 1200, 16)).toBe(32)
  })

  it('uses the fallback when no value is configured', () => {
    expect(resolveResponsiveGridValue(undefined, 1280, 16)).toBe(16)
  })
})
