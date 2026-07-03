import { describe, expect, it } from 'vitest'
import { resolveDrupalTeaserLink } from '../../layers/theme/app/composables/useDrupalTeaserLink'

describe('resolveDrupalTeaserLink', () => {
  it('prefers explicit Drupal urls', () => {
    expect(resolveDrupalTeaserLink({
      url: '/explicit',
      path: {
        alias: '/alias',
      },
      nid: 10,
    })).toBe('/explicit')
  })

  it('uses Drupal path aliases as the canonical teaser link', () => {
    expect(resolveDrupalTeaserLink({
      path: {
        alias: '/production/tall-boy',
      },
      nid: 104,
    })).toBe('/production/tall-boy')
  })

  it('falls back to node paths only when no canonical link exists', () => {
    expect(resolveDrupalTeaserLink({ nid: 15 })).toBe('/node/15')
    expect(resolveDrupalTeaserLink({ id: 16 })).toBe('/node/16')
    expect(resolveDrupalTeaserLink({})).toBeUndefined()
  })
})

