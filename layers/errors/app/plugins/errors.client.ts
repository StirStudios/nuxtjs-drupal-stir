import {
  createBrowserReporter,
  isAutomatedVisitor,
  ownScriptsPrefix,
  parseDsn,
} from '../../utils/errorReport'

type NetworkInformation = { effectiveType?: string, type?: string, saveData?: boolean }

// Reports browser errors (uncaught errors, unhandled rejections and Vue
// errors) to the site's GlitchTip, with the same small reporter the server
// uses: nothing is downloaded, and nothing is sent without a DSN or without
// consent for non-essential scripts (the policy analytics follows), and only
// for errors with a frame in the site's own built scripts.
export default defineNuxtPlugin({
  name: 'errors',
  setup(nuxtApp) {
    const config = useRuntimeConfig().public.errors as { dsn?: string, environment?: string, release?: string } | undefined
    const dsn = parseDsn(config?.dsn)

    if (!dsn || isAutomatedVisitor(navigator.userAgent, navigator.webdriver)) return

    // Read on each report: the integrations layer's consent plugin may run
    // after this one, and a site without it shows no consent notice.
    const allowed = () => nuxtApp.$stirScriptConsent?.allowsNonEssential.value ?? true
    const report = createBrowserReporter({
      dsn,
      ownScripts: ownScriptsPrefix(useRuntimeConfig().app, window.location.origin),
      allowed,
      pageUrl: () => `${window.location.origin}${window.location.pathname}`,
      resources: () => performance.getEntriesByType('resource') as PerformanceResourceTiming[],
      connection: () => (navigator as Navigator & { connection?: NetworkInformation }).connection,
      userAgent: () => navigator.userAgent,
      requestedModules: () => [...document.querySelectorAll<HTMLLinkElement>('link[rel="modulepreload"]')].map(link => link.href),
      pageState: () => ({
        visibility: document.visibilityState,
        online: navigator.onLine,
        msSinceStart: Math.round(performance.now()),
        navigationType: (performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined)?.type,
      }),
      environment: config?.environment,
      release: config?.release,
    })

    window.addEventListener('error', event => report(event.error ?? event.message, event))
    window.addEventListener('unhandledrejection', event => report(event.reason))
    nuxtApp.hook('vue:error', error => report(error))
    nuxtApp.hook('app:error', error => report(error))
  },
})
