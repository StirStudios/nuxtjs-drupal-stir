import {
  buildEvent,
  createThrottle,
  describeModuleLoad,
  hasOwnFrame,
  isAutomatedVisitor,
  isIgnoredBrowserError,
  isModuleLoadFailure,
  messageKey,
  ownScriptsPrefix,
  parseDsn,
  sendEvent,
  toError,
} from '../../utils/errorReport'

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
    const ownScripts = ownScriptsPrefix(useRuntimeConfig().app, window.location.origin)
    const allow = createThrottle(Date.now, 60_000, 20, messageKey)

    function report(value: unknown, source?: string) {
      const error = toError(value)

      if (!allowsNonEssential.value || !error || isIgnoredBrowserError(error, source, window.location.origin) || !hasOwnFrame(error, ownScripts) || !allow(error)) return

      void sendEvent(dsn!, buildEvent(error, {
        platform: 'javascript',
        url: `${window.location.origin}${window.location.pathname}`,
        environment: config?.environment,
        release: config?.release,
        // A failed module load says nothing about which file or how it travelled.
        extra: isModuleLoadFailure(error)
          ? describeModuleLoad(
              performance.getEntriesByType('resource') as PerformanceResourceTiming[],
              ownScripts,
              (navigator as Navigator & { connection?: { effectiveType?: string, type?: string, saveData?: boolean } }).connection,
            )
          : undefined,
      }))
    }

    window.addEventListener('error', event => report(event.error ?? event.message, event.filename))
    window.addEventListener('unhandledrejection', event => report(event.reason))
    nuxtApp.hook('vue:error', error => report(error))
    nuxtApp.hook('app:error', error => report(error))
  },
})
