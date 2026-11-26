import { describe, expect, it } from 'vitest'
import {
  resolveBooleanProp,
  resolveCarouselArrowButton,
  resolveUiButtonVariant,
  resolveUiColor,
  resolveUiFieldVariant,
  resolveUiPageCardVariant,
  resolveUiSize,
} from '../../layers/theme/app/utils/nuxtUiProps'

describe('nuxtUiProps', () => {
  it('normalizes boolean values serialized by Drupal', () => {
    expect(resolveBooleanProp(true)).toBe(true)
    expect(resolveBooleanProp(1)).toBe(true)
    expect(resolveBooleanProp('1')).toBe(true)
    expect(resolveBooleanProp('true')).toBe(true)
    expect(resolveBooleanProp(false)).toBe(false)
    expect(resolveBooleanProp('0')).toBe(false)
    expect(resolveBooleanProp(undefined)).toBe(false)
  })

  it('normalizes shared carousel arrow button defaults', () => {
    expect(resolveCarouselArrowButton()).toEqual({
      color: 'neutral',
      variant: 'outline',
      size: 'xl',
    })
    expect(resolveCarouselArrowButton({
      color: ' primary ',
      variant: 'ghost',
      size: 'sm',
    })).toEqual({
      color: 'primary',
      variant: 'ghost',
      size: 'sm',
    })
  })

  it('normalizes Nuxt UI color values without blocking custom strings', () => {
    expect(resolveUiColor(undefined)).toBe('primary')
    expect(resolveUiColor(' neutral ')).toBe('neutral')
    expect(resolveUiColor('brand')).toBe('brand')
  })

  it('normalizes button variants while preserving downstream custom variants', () => {
    expect(resolveUiButtonVariant(undefined)).toBe('solid')
    expect(resolveUiButtonVariant(' outline ')).toBe('outline')
    expect(resolveUiButtonVariant('material')).toBe('material')
  })

  it('normalizes field variants', () => {
    expect(resolveUiFieldVariant(undefined)).toBe('outline')
    expect(resolveUiFieldVariant(' material ')).toBe('material')
  })

  it('normalizes Nuxt UI page card variants', () => {
    expect(resolveUiPageCardVariant(undefined)).toBe('outline')
    expect(resolveUiPageCardVariant(' subtle ')).toBe('subtle')
  })

  it('normalizes sizes with configured fallbacks', () => {
    expect(resolveUiSize(undefined)).toBe('md')
    expect(resolveUiSize(' 2xl ')).toBe('2xl')
    expect(resolveUiSize('', 'lg')).toBe('lg')
  })
})
