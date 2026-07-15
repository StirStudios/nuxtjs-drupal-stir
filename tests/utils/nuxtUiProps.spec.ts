import { describe, expect, it } from 'vitest'
import {
  resolveCarouselArrowButton,
  resolveOptionalUiButtonVariant,
  resolveOptionalUiColor,
  resolveUiButtonVariant,
  resolveUiColor,
  resolveUiFieldNoMaterialVariant,
  resolveUiFieldVariant,
  resolveUiSize,
} from '../../layers/theme/app/utils/nuxtUiProps'

describe('nuxtUiProps', () => {
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
    expect(resolveOptionalUiColor('')).toBeUndefined()
    expect(resolveOptionalUiColor(' error ')).toBe('error')
  })

  it('normalizes button variants while preserving downstream custom variants', () => {
    expect(resolveUiButtonVariant(undefined)).toBe('solid')
    expect(resolveUiButtonVariant(' outline ')).toBe('outline')
    expect(resolveUiButtonVariant('material')).toBe('material')
    expect(resolveOptionalUiButtonVariant('')).toBeUndefined()
    expect(resolveOptionalUiButtonVariant(' ghost ')).toBe('ghost')
  })

  it('normalizes field variants and excludes material where components do not support it', () => {
    expect(resolveUiFieldVariant(undefined)).toBe('outline')
    expect(resolveUiFieldVariant(' material ')).toBe('material')
    expect(resolveUiFieldNoMaterialVariant('material')).toBe('outline')
    expect(resolveUiFieldNoMaterialVariant('soft')).toBe('soft')
  })

  it('normalizes sizes with configured fallbacks', () => {
    expect(resolveUiSize(undefined)).toBe('md')
    expect(resolveUiSize(' 2xl ')).toBe('2xl')
    expect(resolveUiSize('', 'lg')).toBe('lg')
  })
})
