import { describe, expect, it } from 'vitest'
import {
  resolvePageRequest,
  withoutLegacyDrupalViewPage,
} from '../../layers/theme/app/utils/pageRequest'

describe('resolvePageRequest', () => {
  it('falls back to the homepage while a route path is unavailable', () => {
    expect(resolvePageRequest({})).toEqual({
      path: '/',
      key: '/',
    })
  })

  it('returns the current route path and a path-scoped cache key by default', () => {
    const resolved = resolvePageRequest({
      path: '/about',
      fullPath: '/about?tab=team#members',
    })

    expect(resolved.path).toBe('/about')
    expect(resolved.key).toBe('/about')
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

describe('withoutLegacyDrupalViewPage', () => {
  it('ignores the ambiguous plain Drupal pager parameter', () => {
    expect(withoutLegacyDrupalViewPage({ page: '1', search: 'dance' })).toEqual({
      search: 'dance',
    })
  })

  it('preserves namespaced View pager parameters', () => {
    const query = {
      work_adc46254_page: '1',
      search: 'dance',
    }

    expect(withoutLegacyDrupalViewPage(query)).toEqual(query)
  })
})
