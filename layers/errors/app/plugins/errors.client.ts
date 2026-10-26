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

    const { allowsNonEssential } = usePrivacyConsent()
    const report = createBrowserReporter({
      dsn,
      ownScripts: ownScriptsPrefix(useRuntimeConfig().app, window.location.origin),
      allowed: () => allowsNonEssential.value,
      pageUrl: () => `${window.location.origin}${window.location.pathname}`,
      resources: () => performance.getEntriesByType('resource') as PerformanceResourceTiming[],
      connection: () => (navigator as Navigator & { connection?: NetworkInformation }).connection,
      environment: config?.environment,
      release: config?.release,
    })

    window.addEventListener('error', event => report(event.error ?? event.message, event))
    window.addEventListener('unhandledrejection', event => report(event.reason))
    nuxtApp.hook('vue:error', error => report(error))
    nuxtApp.hook('app:error', error => report(error))
  },
})
