import { describe, expect, it } from 'vitest'
import { resolveSpacingClasses } from '../../layers/theme/app/utils/spacingClasses'
import { catalogueUtilities, layoutVocabulary, mergePresentationConfigs } from '../../layers/theme/build/presentationSource'

describe('spacing steps', () => {
  it('maps steps to the classes the old Spacing field rendered', () => {
    expect(resolveSpacingClasses(undefined, 'xsmall', 'large')).toBe('pt-2 pb-10 lg:pb-20')
    expect(resolveSpacingClasses(undefined, 'medium', undefined)).toBe('pt-10')
    expect(resolveSpacingClasses(undefined, undefined, 'small')).toBe('pb-5')
  })

  it('returns nothing for no step or an unknown one', () => {
    expect(resolveSpacingClasses(undefined, undefined, undefined)).toBeUndefined()
    expect(resolveSpacingClasses(undefined, 'huge', '')).toBeUndefined()
  })

  it('uses a project size over the layer one, step by step', () => {
    const scale = { large: { top: 'pt-24', bottom: 'pb-24' } }

    expect(resolveSpacingClasses(scale, 'large', 'small')).toBe('pt-24 pb-5')
  })

  it('compiles the layer sizes and any project sizes', () => {
    expect(layoutVocabulary()).toEqual(expect.arrayContaining(['pt-2', 'pb-2', 'lg:pt-20', 'lg:pb-20']))
    const presentation = mergePresentationConfigs([{ spacing: { large: { top: 'pt-24', bottom: 'pb-24' } } }, {}])

    expect(catalogueUtilities(presentation)).toEqual(expect.arrayContaining(['pt-24', 'pb-24']))
  })
})
