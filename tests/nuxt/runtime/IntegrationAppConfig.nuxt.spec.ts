import { describe, expect, it } from 'vitest'

describe('optional integration app config', () => {
  it('merges defaults from the enabled full-preset capabilities', () => {
    const appConfig = useAppConfig()

    expect(appConfig.analytics.plausible?.domain).toBe('')
    expect(appConfig.userway.enabled).toBe(false)
    expect(appConfig.userway.loadDelayMs).toBe(5000)
  })
})
