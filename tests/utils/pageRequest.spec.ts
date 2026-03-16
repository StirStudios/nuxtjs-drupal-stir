import { describe, expect, it } from 'vitest'
import { resolvePageRequest } from '../../app/utils/pageRequest'

describe('resolvePageRequest', () => {
  it('returns the current route path and a hash-free cache key by default', () => {
    const resolved = resolvePageRequest({
      path: '/about',
      fullPath: '/about?tab=team#members',
    })

    expect(resolved.path).toBe('/about')
    expect(resolved.key).toBe('/about?tab=team')
  })

  it('falls back to the route path when the full path has no hash', () => {
    const resolved = resolvePageRequest({
      path: '/contact',
      fullPath: '/contact',
    })

    expect(resolved.path).toBe('/contact')
    expect(resolved.key).toBe('/contact')
  })
})
