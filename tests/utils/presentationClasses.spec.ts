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

  it('falls back to free-text classes when no known choice is set', () => {
    expect(resolvePresentationClasses(catalogue, {}, 'legacy classes')).toBe('legacy classes')
    expect(resolvePresentationClasses(catalogue, { surface: 'gone' }, 'legacy')).toBe('legacy')
    expect(resolvePresentationClasses(catalogue, {})).toBeUndefined()
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
