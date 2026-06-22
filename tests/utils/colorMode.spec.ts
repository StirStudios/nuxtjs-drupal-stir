import { describe, expect, it } from 'vitest'
import { getRouteColorModeOverride } from '../../layers/theme/app/utils/colorMode'

describe('getRouteColorModeOverride', () => {
  it('matches configured routes exactly by default', () => {
    expect(
      getRouteColorModeOverride({
        path: '/work',
        darkRoutes: ['/work'],
      }),
    ).toBe('dark')

    expect(
      getRouteColorModeOverride({
        path: '/work/lacdc',
        darkRoutes: ['/work'],
      }),
    ).toBeUndefined()
  })

  it('matches a route and child routes when a route rule uses a wildcard suffix', () => {
    expect(
      getRouteColorModeOverride({
        path: '/work',
        darkRoutes: ['/work*'],
      }),
    ).toBe('dark')

    expect(
      getRouteColorModeOverride({
        path: '/work/lacdc',
        darkRoutes: ['/work*'],
      }),
    ).toBe('dark')

    expect(
      getRouteColorModeOverride({
        path: '/workshop',
        darkRoutes: ['/work*'],
      }),
    ).toBeUndefined()
  })

  it('matches only child routes when a route rule uses a slash wildcard suffix', () => {
    expect(
      getRouteColorModeOverride({
        path: '/work',
        darkRoutes: ['/work/*'],
      }),
    ).toBeUndefined()

    expect(
      getRouteColorModeOverride({
        path: '/work/lacdc',
        darkRoutes: ['/work/*'],
      }),
    ).toBe('dark')

    expect(
      getRouteColorModeOverride({
        path: '/work/',
        darkRoutes: ['/work/*'],
      }),
    ).toBeUndefined()
  })

  it('keeps light route overrides ahead of dark route overrides', () => {
    expect(
      getRouteColorModeOverride({
        path: '/work/lacdc',
        lightRoutes: ['/work/lacdc'],
        darkRoutes: ['/work*'],
      }),
    ).toBe('light')
  })
})
