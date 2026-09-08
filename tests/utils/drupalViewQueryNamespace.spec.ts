import { describe, expect, it } from 'vitest'
import {
  resolveDrupalViewQueryNamespace,
  resolveLegacyDrupalViewQueryNamespace,
  sanitizeDrupalViewQueryNamespace,
} from '../../layers/theme/app/utils/drupalViewQueryNamespace'

describe('Drupal View query namespaces', () => {
  it('sanitizes explicit namespaces for readable URL query keys', () => {
    expect(sanitizeDrupalViewQueryNamespace('  Featured Work / 2026  '))
      .toBe('featured_work_2026')
    expect(sanitizeDrupalViewQueryNamespace('Témoignages---Primary'))
      .toBe('temoignages_primary')
  })

  it('prefers explicit and stable paragraph instance identifiers', () => {
    expect(resolveDrupalViewQueryNamespace({
      queryNamespace: 'Manual Namespace',
      paragraphUuid: 'ignored',
      viewId: 'work',
    })).toBe('manual_namespace')

    expect(resolveDrupalViewQueryNamespace({
      paragraphUuid: 'A0B1-C2D3',
      paragraphId: 42,
      viewId: 'Work',
    })).toBe('work_p42')

    expect(resolveDrupalViewQueryNamespace({
      paragraphId: 42,
      viewId: 'Work',
    })).toBe('work_p42')
  })

  it('retains UUID-only fallbacks and resolves old links separately', () => {
    const identity = { paragraphUuid: 'A0B1-C2D3', paragraphId: 42, viewId: 'work' }

    expect(resolveLegacyDrupalViewQueryNamespace(identity)).toBe('work_a0b1_c2d3')
    expect(resolveDrupalViewQueryNamespace({ paragraphUuid: 'A0B1-C2D3', viewId: 'work' }))
      .toBe('work_a0b1_c2d3')
    expect(resolveDrupalViewQueryNamespace({ ...identity, paragraphId: 43 }))
      .toBe('work_p43')
  })

  it('falls back deterministically to the View, display, and arguments', () => {
    const first = resolveDrupalViewQueryNamespace({
      viewId: 'articles',
      displayId: 'featured_block',
      args: { category: 4, tags: ['news', 'events'] },
    })
    const reordered = resolveDrupalViewQueryNamespace({
      viewId: 'articles',
      displayId: 'featured_block',
      args: { tags: ['news', 'events'], category: 4 },
    })
    const differentContext = resolveDrupalViewQueryNamespace({
      viewId: 'articles',
      displayId: 'featured_block',
      args: { category: 5, tags: ['news', 'events'] },
    })

    expect(first).toBe(reordered)
    expect(first).toMatch(/^articles_featured_block_[a-z0-9]+$/)
    expect(differentContext).not.toBe(first)
  })
})
