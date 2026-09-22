import { describe, expect, it } from 'vitest'
import {
  headerClassName,
  headerConfigString,
  headerDesktopLayout,
  headerLogoSurface,
  headerMenuAngleStyle,
  headerToggleDirection,
  joinHeaderClasses,
} from '../../layers/theme/app/utils/headerTheme'

describe('header theme', () => {
  it('falls back to the documented defaults for unknown values', () => {
    expect(headerToggleDirection('left')).toBe('left')
    expect(headerToggleDirection('diagonal')).toBe('right')
    expect(headerDesktopLayout('split-logo')).toBe('split-logo')
    expect(headerDesktopLayout(undefined)).toBe('default')
    expect(headerLogoSurface('dark')).toBe('dark')
    expect(headerLogoSurface(1)).toBe('auto')
    expect(headerConfigString('  primary ')).toBe('primary')
    expect(headerConfigString('  ')).toBeUndefined()
    expect(headerConfigString(3)).toBeUndefined()
  })

  it('flattens class config and drops empty fragments', () => {
    expect(headerClassName([' a ', ['b', ''], 1])).toBe('a b')
    expect(headerClassName({ a: true })).toBe('')
    expect(joinHeaderClasses('x', false, undefined, ['y', 'z'], '')).toBe('x y z')
  })

  it('builds angled slideover variables only when the panel is angled', () => {
    expect(headerMenuAngleStyle(undefined)).toBeUndefined()
    expect(headerMenuAngleStyle({ angle: false, angleDeg: 50 })).toBeUndefined()
    expect(headerMenuAngleStyle({ angle: true })).toEqual({ '--stir-menu-angle-edge': '22.75%' })
    expect(headerMenuAngleStyle({ angle: true, angleDeg: 200, angleOffsetX: 12 })).toEqual({
      '--stir-menu-angle-edge': '48%',
      '--stir-menu-offset-x': '12px',
    })
    expect(headerMenuAngleStyle({ angle: true, angleDeg: Number.NaN, angleOffsetX: '2rem' })).toEqual({
      '--stir-menu-angle-edge': '22.75%',
      '--stir-menu-offset-x': '2rem',
    })
  })
})
