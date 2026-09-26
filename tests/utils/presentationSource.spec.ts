import { describe, expect, it } from 'vitest'
import {
  buildPresentationSource,
  catalogueUtilities,
  inlinePresentationSource,
  layoutVocabulary,
  mergePresentationConfigs,
} from '../../layers/theme/build/presentationSource'
import {
  GRID_BREAKPOINTS,
  WIDTH_MAX_WIDTH_CLASSES,
  resolveAlignClasses,
  resolveGridClasses,
  resolveWidthClasses,
  type AlignAxisValue,
} from '../../layers/theme/app/utils/gridClasses'

describe('presentation source', () => {
  it('compiles every layout option whether or not content uses it', () => {
    const { source } = buildPresentationSource()

    for (const utility of ['md:grid-cols-5', '2xl:gap-17', 'xs:basis-1/9', 'pt-10', 'lg:pt-20', 'lg:max-w-6xl', 'items-end']) {
      expect(source).toContain(utility)
    }
  })

  it('covers every class the layout resolvers can produce', () => {
    const vocabulary = new Set(layoutVocabulary())
    const produced = new Set<string>()
    const collect = (classes: string) => classes.split(' ').filter(Boolean).forEach(utility => produced.add(utility))
    const axis: Array<AlignAxisValue | undefined> = [undefined, 'start', 'center', 'end']

    for (const breakpoint of GRID_BREAKPOINTS) {
      for (let columns = 1; columns <= 12; columns++) {
        collect(resolveGridClasses({ columns: { [breakpoint]: columns } }))
        collect(resolveGridClasses({ columns: { [breakpoint]: columns } }, 'carousel'))
      }
      for (let gap = 0; gap <= 20; gap++) collect(resolveGridClasses({ gap: { [breakpoint]: gap } }))
    }
    for (const justify of axis) {
      for (const items of axis) {
        for (const text of axis) {
          const align = { justify, items, text }

          collect(resolveAlignClasses(align))
          for (const width of Object.keys(WIDTH_MAX_WIDTH_CLASSES)) collect(resolveWidthClasses(width, align))
        }
      }
    }

    expect([...produced].filter(utility => !vocabulary.has(utility))).toEqual([])
  })

  it('compiles every class the presentation catalogue and rich-text list declare', () => {
    const warnings: string[] = []
    const utilities = catalogueUtilities({
      surfaces: { spotlight: { label: 'Spotlight', class: 'dp-spotlight bg-muted/50' } },
      variants: { card: { label: 'Card', class: 'p-7 lg:p-12' } },
      richText: ['mb-4', 'text-center', 'bad"token', ['bg-', '[url(evil)]'].join('')],
    }, { warn: message => warnings.push(message) })

    expect(utilities).toEqual(['bg-muted/50', 'dp-spotlight', 'lg:p-12', 'mb-4', 'p-7', 'text-center'])
    expect(warnings).toEqual([
      'Ignored unsafe presentation class token: bad"token',
      'Ignored unsafe presentation class token: bg-[url(evil)]',
    ])

    const { source } = buildPresentationSource({ extraUtilities: utilities })

    expect(source).toContain('lg:p-12')
    expect(source).toContain('md:grid-cols-5')
  })

  it('merges presentation config from every layer, nearest first', () => {
    const merged = mergePresentationConfigs([
      { surfaces: { muted: { label: 'Project muted', class: 'bg-muted/50' } }, richText: ['mb-4'] },
      { variants: { card: { label: 'Card', class: 'p-7' } }, richText: ['mb-4', 'mt-6'] },
      { surfaces: { muted: { label: 'Muted', class: 'bg-muted' }, inverted: { label: 'Inverted', class: 'bg-inverted' } } },
    ])

    expect(merged.surfaces.muted?.class).toBe('bg-muted/50')
    expect(merged.surfaces.inverted?.class).toBe('bg-inverted')
    expect(merged.variants.card?.class).toBe('p-7')
    expect(merged.richText).toEqual(['mb-4', 'mt-6'])
  })

  it('emits literal Tailwind 4 inline sources', () => {
    const source = inlinePresentationSource(['gap-4', 'grid-cols-2'])

    expect(source).toBe('@source inline("gap-4 grid-cols-2");\n')
  })

  it('gives generated sources a deterministic identity', () => {
    const options = { extraUtilities: ['p-7', 'text-center'] }
    const source = buildPresentationSource(options)

    expect(buildPresentationSource(options)).toEqual(source)
    expect(source.sourceRevision).toMatch(/^[a-f0-9]{64}$/u)
    expect(source.sourceRevision).not.toBe(buildPresentationSource().sourceRevision)
    expect(source.sourceBytes).toBe(Buffer.byteLength(source.source, 'utf8'))
  })
})
