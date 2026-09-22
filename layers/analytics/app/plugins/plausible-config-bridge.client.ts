import type { PlausibleRequestPayload, track } from '@plausible-analytics/tracker'

type PlausibleEventOptions = Parameters<typeof track>[1]
type PlausibleTracker = typeof import('@plausible-analytics/tracker')
type PlausibleRuntimeConfig = {
  enabled?: boolean
  domain?: string
  apiHost?: string
  autoPageviews?: boolean
  autoOutboundTracking?: boolean
  fileDownloads?: boolean | { fileExtensions: string[] }
  formSubmissions?: boolean
  hashMode?: boolean
  ignoredHostnames?: string[]
  ignoreSubDomains?: boolean
  logIgnoredEvents?: boolean
  proxy?: boolean
  proxyBaseEndpoint?: string
}

const CONSENT_OPT_OUT_MARKER = 'stir:plausible-consent-opt-out'
const PLAUSIBLE_OPT_OUT_KEY = 'plausible_ignore'

function plausibleEndpoint(options: PlausibleRuntimeConfig): string {
  if (options.proxy) {
    const base = options.proxyBaseEndpoint || '/_plausible'

    return `${base.replace(/\/$/, '')}/api/event`
  }

  const base = options.apiHost || 'https://plausible.io'

  return `${base.replace(/\/$/, '')}/api/event`
}

function hostnameFilter(options: PlausibleRuntimeConfig) {
  const ignoredHostnames = (options.ignoredHostnames || [])
    .filter((hostname) => hostname !== 'localhost')

  if (!ignoredHostnames.length) return undefined

  return (payload: PlausibleRequestPayload) => {
    const hostname = window.location.hostname
    const isIgnored = ignoredHostnames.some((ignored) =>
      options.ignoreSubDomains
        ? hostname === ignored || hostname.endsWith(`.${ignored}`)
        : hostname === ignored,
    )

    return isIgnored ? null : payload
  }
}

function syncPlausibleOptOut(allowed: boolean): void {
  try {
    if (!allowed) {
      if (localStorage.getItem(PLAUSIBLE_OPT_OUT_KEY) !== 'true') {
        localStorage.setItem(PLAUSIBLE_OPT_OUT_KEY, 'true')
        localStorage.setItem(CONSENT_OPT_OUT_MARKER, 'true')
      }
      return
    }

    if (localStorage.getItem(CONSENT_OPT_OUT_MARKER) === 'true') {
      localStorage.removeItem(PLAUSIBLE_OPT_OUT_KEY)
      localStorage.removeItem(CONSENT_OPT_OUT_MARKER)
    }
  } catch {
    // Storage can be unavailable in privacy-focused browser contexts.
  }
}

// Owns Plausible on the client. The @nuxtjs/plausible plugin, which would
// import the tracker into the entry bundle, is removed in this layer's
// nuxt.config.ts; its composables, proxy and preconnect plugin still apply.
// The tracker is fetched and initialised only once tracking is enabled and
// consent allows it, so visitors who decline never download it.
export default defineNuxtPlugin({
  name: 'plausible-config-bridge',
  enforce: 'pre',
  setup(nuxtApp) {
    const appCfg = useAppConfig().analytics?.plausible as
      | PlausibleRuntimeConfig
      | undefined
    const runtimeCfg = useRuntimeConfig()
    const plausible = runtimeCfg.public.plausible as
      | PlausibleRuntimeConfig
      | undefined

    if (!plausible) return

    if (appCfg?.enabled === false) plausible.enabled = false
    if (appCfg?.domain) plausible.domain = appCfg.domain

    const enabled = plausible.enabled !== false
    const { allowsNonEssential } = usePrivacyConsent()
    let tracker: Promise<PlausibleTracker> | undefined

    // Without consent the preconnect plugin, which reads this, stays silent.
    if (enabled && !allowsNonEssential.value) plausible.enabled = false

    const loadTracker = () => tracker ??= import('@plausible-analytics/tracker').then((module) => {
      module.init({
        domain: plausible.domain || window.location.hostname,
        endpoint: plausibleEndpoint(plausible),
        autoCapturePageviews: plausible.autoPageviews,
        hashBasedRouting: plausible.hashMode,
        outboundLinks: plausible.autoOutboundTracking,
        fileDownloads: plausible.fileDownloads,
        formSubmissions: plausible.formSubmissions,
        captureOnLocalhost: !(plausible.ignoredHostnames || []).includes('localhost'),
        logging: plausible.logIgnoredEvents,
        transformRequest: hostnameFilter(plausible),
      })
      plausible.enabled = true

      return module
    })

    const send = (eventName: string, options?: PlausibleEventOptions) => {
      if (!enabled || !allowsNonEssential.value) return
      void loadTracker().then(module => module.track(eventName, options || {}))
    }

    nuxtApp.provide('plausible', {
      trackEvent: send,
      trackPageview: (options?: PlausibleEventOptions) => send('pageview', options),
    })

    watch(
      allowsNonEssential,
      (allowed) => {
        syncPlausibleOptOut(allowed)
        if (allowed && enabled) void loadTracker()
      },
      { flush: 'sync', immediate: true },
    )
  },
})
