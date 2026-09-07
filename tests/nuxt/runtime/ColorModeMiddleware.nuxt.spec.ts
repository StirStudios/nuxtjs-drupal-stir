import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import type { ColorModePolicyInput } from '../../../layers/theme/app/utils/colorMode'
import middleware from '../../../layers/theme/app/middleware/colorMode.global'

const { config, colorMode } = vi.hoisted(() => ({
  config: { colorMode: {} as ColorModePolicyInput },
  colorMode: { preference: 'system' },
}))

mockNuxtImport('useAppConfig', () => () => config)
mockNuxtImport('useColorMode', () => () => colorMode)

function visit(path: string, meta: Record<string, unknown> = {}) {
  const to = { path, meta } as Parameters<typeof middleware>[0]

  middleware(to, to)
  return to.meta
}

beforeEach(() => {
  config.colorMode = { preference: 'light', showToggle: false }
  colorMode.preference = 'dark'
})

describe('fixed color policy during SSR routing', () => {
  it('exposes the fixed global theme to Nuxt before hydration', () => {
    expect(visit('/', { title: 'Home' })).toEqual({ title: 'Home', colorMode: 'light' })
    expect(colorMode.preference).toBe('light')
  })

  it('returns to the global theme after a route override', () => {
    config.colorMode.darkRoutes = ['/about']
    expect(visit('/about').colorMode).toBe('dark')
    expect(visit('/').colorMode).toBe('light')
    expect(colorMode.preference).toBe('light')
  })

  it('keeps a forced global theme ahead of route overrides', () => {
    config.colorMode = { forced: true, preference: 'dark', lightRoutes: ['/about'] }
    expect(visit('/about').colorMode).toBe('dark')
  })

  it('preserves an unlocked user preference and clears route forcing', () => {
    config.colorMode.showToggle = true
    expect(visit('/', { colorMode: 'light' }).colorMode).toBeUndefined()
    expect(colorMode.preference).toBe('dark')
  })

  it.each([true, false])('does not force a system preference when showToggle is %s', (showToggle) => {
    config.colorMode = { preference: 'system', showToggle }
    colorMode.preference = 'system'
    expect(visit('/').colorMode).toBeUndefined()
    expect(colorMode.preference).toBe('system')
  })
})
