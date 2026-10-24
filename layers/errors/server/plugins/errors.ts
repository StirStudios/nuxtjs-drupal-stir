import { buildEvent, createThrottle, parseDsn, sendEvent, shouldReport } from '../../utils/errorReport'

// Server errors (render and API failures, status 500 and up) go to the site's
// GlitchTip. No DSN, no plugin work.
export default defineNitroPlugin((nitroApp) => {
  const config = useRuntimeConfig().public.errors as { dsn?: string, environment?: string, release?: string } | undefined
  const dsn = parseDsn(config?.dsn)

  if (!dsn) return

  const allow = createThrottle()

  nitroApp.hooks.hook('error', (error, context) => {
    if (!shouldReport(error) || !allow(error)) return

    const event = context?.event

    void sendEvent(dsn, buildEvent(error, {
      url: event?.path,
      method: event?.method,
      environment: config?.environment,
      release: config?.release,
    }))
  })
})
