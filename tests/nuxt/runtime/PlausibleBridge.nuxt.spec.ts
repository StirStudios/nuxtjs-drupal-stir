import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { consent, tracker } = vi.hoisted(() => ({
  consent: { allowed: undefined as unknown as { value: boolean } },
  tracker: { init: vi.fn(), track: vi.fn() },
}))

vi.mock('@plausible-analytics/tracker', () => tracker)

mockNuxtImport('usePrivacyConsent', () => () => ({ allowsNonEssential: consent.allowed }))

type PlausibleClient = {
  trackEvent: (name: string, options?: object) => void
  trackPageview: (options?: object) => void
}

async function startBridge(options: Record<string, unknown> = {}) {
  const config = useRuntimeConfig().public as Record<string, unknown>

  config.plausible = {
    enabled: true,
    domain: 'example.com',
    apiHost: 'https://plausible.io',
    ignoredHostnames: ['localhost'],
    ...options,
  }

  const provided: Record<string, unknown> = {}
  const { default: bridge } = await import('../../../layers/analytics/app/plugins/plausible-config-bridge.client')

  await (bridge as unknown as (app: object) => unknown)({
    provide: (name: string, value: unknown) => { provided[name] = value },
  })

  return {
    client: provided.plausible as PlausibleClient,
    options: config.plausible as Record<string, unknown>,
  }
}

describe('Plausible bridge', () => {
  let originalPlausible: unknown

  beforeEach(() => {
    originalPlausible = (useRuntimeConfig().public as Record<string, unknown>).plausible
    tracker.init.mockClear()
    tracker.track.mockClear()
  })

  afterEach(() => {
    (useRuntimeConfig().public as Record<string, unknown>).plausible = originalPlausible
  })

  it('does not fetch the tracker or preconnect until consent allows tracking', async () => {
    consent.allowed = ref(false)
    const { client, options } = await startBridge()

    client.trackEvent('Signup')
    await flushPromises()

    expect(tracker.init).not.toHaveBeenCalled()
    expect(tracker.track).not.toHaveBeenCalled()
    expect(options.enabled).toBe(false)

    consent.allowed.value = true
    await flushPromises()

    expect(tracker.init).toHaveBeenCalledOnce()
    expect(tracker.init).toHaveBeenCalledWith(expect.objectContaining({
      domain: 'example.com',
      endpoint: 'https://plausible.io/api/event',
    }))
    expect(options.enabled).toBe(true)

    client.trackEvent('Signup', { props: { plan: 'pro' } })
    await flushPromises()

    expect(tracker.track).toHaveBeenCalledWith('Signup', { props: { plan: 'pro' } })
    expect(tracker.init).toHaveBeenCalledOnce()
  })

  it('initialises once when consent is already given and routes events through it', async () => {
    consent.allowed = ref(true)
    const { client } = await startBridge({ proxy: true, proxyBaseEndpoint: '/_plausible/' })

    client.trackPageview()
    await flushPromises()

    expect(tracker.init).toHaveBeenCalledOnce()
    expect(tracker.init).toHaveBeenCalledWith(expect.objectContaining({
      endpoint: '/_plausible/api/event',
    }))
    expect(tracker.track).toHaveBeenCalledWith('pageview', {})
  })

  it('never loads the tracker when tracking is disabled', async () => {
    consent.allowed = ref(true)
    const { client } = await startBridge({ enabled: false })

    client.trackEvent('Signup')
    await flushPromises()

    expect(tracker.init).not.toHaveBeenCalled()
    expect(tracker.track).not.toHaveBeenCalled()
  })
})
