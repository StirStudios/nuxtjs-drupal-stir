import { describe, expect, it } from 'vitest'
import {
  maxGridColumns,
  resolveAlignClasses,
  resolveGridClasses,
  resolveWidthClasses,
} from '../../layers/theme/app/utils/gridClasses'

describe('resolveGridClasses', () => {
  it('returns an empty string when nothing is authored', () => {
    expect(resolveGridClasses(undefined)).toBe('')
  })

  it('defaults to a single column in grid mode once any grid config is set', () => {
    expect(resolveGridClasses({})).toBe('grid grid-cols-1')
    expect(resolveGridClasses({ gap: { default: 4 } })).toBe('grid grid-cols-1 gap-4')
  })

  it('builds responsive grid-cols and gap classes', () => {
    expect(resolveGridClasses({
      columns: { default: 1, lg: 3 },
      gap: { default: 0, lg: 6 },
    })).toBe('grid grid-cols-1 lg:grid-cols-3 lg:gap-6')
  })

  it('omits a zero gap, matching Tailwind having no gap-0 need', () => {
    expect(resolveGridClasses({ columns: { default: 2 }, gap: { default: 0 } }))
      .toBe('grid grid-cols-2')
  })

  it('passes an arbitrary Tailwind grid-template-columns value through as-is', () => {
    expect(resolveGridClasses({ columns: { lg: '[8fr_4fr]' }, gap: { lg: 6 } }))
      .toBe('grid grid-cols-1 lg:grid-cols-[8fr_4fr] lg:gap-6')
  })

  it('builds embla slide-basis fractions in carousel mode instead of grid-cols', () => {
    expect(resolveGridClasses({ columns: { default: 1, md: 3 } }, 'carousel'))
      .toBe('basis-full md:basis-1/3')
  })
})

describe('maxGridColumns', () => {
  it('returns the largest numeric column count', () => {
    expect(maxGridColumns({ columns: { default: 1, md: 2, lg: 5 } })).toBe(5)
  })

  it('ignores arbitrary Tailwind value columns', () => {
    expect(maxGridColumns({ columns: { lg: '[8fr_4fr]' } })).toBe(0)
  })

  it('returns 0 when unset', () => {
    expect(maxGridColumns(undefined)).toBe(0)
  })
})

describe('resolveAlignClasses', () => {
  it('returns an empty string when unset', () => {
    expect(resolveAlignClasses(undefined)).toBe('')
  })

  it('builds justify/items classes with the md:flex prefix', () => {
    expect(resolveAlignClasses({ justify: 'start', items: 'start' }))
      .toBe('md:flex justify-start items-start')
  })

  it('builds a text class without forcing flex when justify/items are unset', () => {
    expect(resolveAlignClasses({ text: 'center' })).toBe('text-center')
  })

  it('combines all three axes', () => {
    expect(resolveAlignClasses({ justify: 'end', items: 'center', text: 'end' }))
      .toBe('md:flex justify-end items-center text-end')
  })
})

describe('resolveWidthClasses', () => {
  it('returns an empty string when unset or unrecognized', () => {
    expect(resolveWidthClasses(undefined, undefined)).toBe('')
    expect(resolveWidthClasses('huge', undefined)).toBe('')
  })

  it('auto-centers by default', () => {
    expect(resolveWidthClasses('lg', undefined)).toBe('mx-auto lg:max-w-4xl')
  })

  it('drops the auto-center margin when alignment already justifies the block', () => {
    expect(resolveWidthClasses('xl', { justify: 'start' })).toBe('lg:max-w-5xl')
    expect(resolveWidthClasses('2xl', { justify: 'end' })).toBe('lg:max-w-6xl')
  })

  it('keeps auto-centering for a centered or unset justify value', () => {
    expect(resolveWidthClasses('xs', { justify: 'center' })).toBe('mx-auto sm:max-w-lg')
  })
})
