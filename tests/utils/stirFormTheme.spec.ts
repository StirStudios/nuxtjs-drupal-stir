import { afterEach, describe, expect, it, vi } from 'vitest'
import { useStirFormTheme } from '../../layers/foundation/app/composables/useStirFormTheme'

afterEach(() => vi.unstubAllGlobals())

describe('shared form theme', () => {
  it.each([{}, { stirTheme: {} }])('supports consumers without authored form settings', (config) => {
    vi.stubGlobal('useAppConfig', () => config)

    expect(useStirFormTheme()).toEqual({ floatingLabels: false, variant: 'outline' })
  })

  it('preserves explicit consumer settings', () => {
    vi.stubGlobal('useAppConfig', () => ({
      stirTheme: { forms: { floatingLabels: true, variant: 'material' } },
    }))

    expect(useStirFormTheme()).toEqual({ floatingLabels: true, variant: 'material' })
  })
})
