import { describe, expect, it } from 'vitest'
import { resolvePresentationClasses } from '../../layers/theme/app/utils/presentationClasses'
import { STIR_PRESENTATION_DEFAULTS } from '../../layers/theme/app/utils/presentationDefaults'
import { buildPresentationCatalogue } from '../../layers/theme/server/utils/presentationCatalogue'

describe('presentation choices', () => {
  const catalogue = {
    surfaces: { ...STIR_PRESENTATION_DEFAULTS.surfaces, spotlight: { label: 'Spotlight', class: 'dp-spotlight' } },
    variants: STIR_PRESENTATION_DEFAULTS.variants,
  }

  it('resolves a surface, a variant, or both, surface first', () => {
    expect(resolvePresentationClasses(catalogue, { surface: 'spotlight' })).toBe('dp-spotlight')
    expect(resolvePresentationClasses(catalogue, { variant: 'action-group-center' })).toBe('action-group action-group--center')
    expect(resolvePresentationClasses(catalogue, { surface: 'muted', variant: 'action-group' })).toBe('bg-muted action-group')
  })

  it('adds dark for a choice with colorMode dark, once', () => {
    const dark = {
      surfaces: { navy: { label: 'Navy', class: 'bg-navy text-default', colorMode: 'dark' as const } },
      variants: { framed: { label: 'Framed', class: 'dark p-6', colorMode: 'dark' as const } },
    }

    expect(resolvePresentationClasses(dark, { surface: 'navy' })).toBe('dark bg-navy text-default')
    expect(resolvePresentationClasses(dark, { surface: 'navy', variant: 'framed' })).toBe('bg-navy text-default dark p-6')
  })

  it('keeps a hand-written dark class working', () => {
    const legacy = { surfaces: { navy: { label: 'Navy', class: 'dark bg-navy text-default' } } }

    expect(resolvePresentationClasses(legacy, { surface: 'navy' })).toBe('dark bg-navy text-default')
  })

  it('resolves nothing without a known choice', () => {
    expect(resolvePresentationClasses(catalogue, {})).toBeUndefined()
    expect(resolvePresentationClasses(catalogue, { surface: 'gone' })).toBeUndefined()
  })

  it('publishes IDs and labels only, with a revision that follows the choices', async () => {
    const published = await buildPresentationCatalogue(catalogue)

    expect(published.surfaces).toContainEqual({ id: 'spotlight', label: 'Spotlight' })
    expect(JSON.stringify(published)).not.toContain('dp-spotlight')
    expect(published.revision).toMatch(/^[a-f0-9]{64}$/u)
    expect((await buildPresentationCatalogue(catalogue)).revision).toBe(published.revision)
    expect((await buildPresentationCatalogue({ surfaces: {} })).revision).not.toBe(published.revision)
  })
})
