import { describe, expect, it } from 'vitest'
import { useAppConfig } from '#app'

describe('Turnstile configuration', () => {
  it('defaults to the low-friction interaction-only appearance', () => {
    const appConfig = useAppConfig()

    expect(appConfig.stirTheme.turnstile.appearance).toBe('interaction-only')
  })
})
