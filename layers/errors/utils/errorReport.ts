// Reports errors to GlitchTip (Sentry-compatible) through its envelope
// endpoint with a plain fetch, on the server and in the browser: the Sentry
// SDKs pull in far more code than reporting an error needs (the browser one
// is about 140 kB gzipped, the Node one brings OpenTelemetry). Only the path
// leaves the page or the server (never the query string, headers, cookies or
// request bodies), and the key travels in the query string, as the SDKs send
// it, so a browser makes no CORS preflight request.

export interface ErrorDsn {
  key: string
  envelopeUrl: string
}

export interface StackFrame {
  function?: string
  filename: string
  lineno: number
  colno: number
}

export interface ReportContext {
  platform?: 'node' | 'javascript'
  url?: string
  method?: string
  environment?: string
  release?: string
}

const MAX_MESSAGE = 500
const MAX_FRAMES = 50

// https://<public key>@host[:port]/<numeric project id>
export function parseDsn(value: string | undefined): ErrorDsn | null {
  if (!value) return null

  let url: URL

  try {
    url = new URL(value)
  }
  catch {
    return null
  }

  const project = url.pathname.replace(/^\/+|\/+$/g, '')

  if (!['http:', 'https:'].includes(url.protocol) || !url.username || !/^\d+$/.test(project)) return null

  return { key: url.username, envelopeUrl: `${url.protocol}//${url.host}/api/${project}/envelope/?sentry_version=7&sentry_key=${encodeURIComponent(url.username)}&sentry_client=stir-errors%2F1` }
}

function decodePath(path: string): string {
  try {
    return decodeURIComponent(path)
  }
  catch {
    return path
  }
}

// Stack lines from V8 ("at fn (file:1:2)") and from Firefox and Safari
// ("fn@file:1:2"), oldest call first as Sentry expects.
export function parseStack(stack: string | undefined): StackFrame[] {
  const frames: StackFrame[] = []

  for (const line of (stack || '').split('\n')) {
    const match = line.match(/^\s*at (?:async )?(?:(.+?) \()?(?:async )?(.+?):(\d+):(\d+)\)?\s*$/)
      || line.match(/^\s*(.*?)@(.+?):(\d+):(\d+)\s*$/)

    if (!match) continue

    frames.push({
      function: match[1] || undefined,
      filename: decodePath(match[2]!.replace(/^file:\/\//, '')),
      lineno: Number(match[3]),
      colno: Number(match[4]),
    })
  }

  return frames.slice(0, MAX_FRAMES).reverse()
}

// A page not found or refused is not a fault of the site.
export function shouldReport(error: unknown): boolean {
  const status = (error as { statusCode?: number } | null)?.statusCode

  return typeof status !== 'number' || status >= 500
}

export function buildEvent(error: Error, context: ReportContext, eventId = crypto.randomUUID().replaceAll('-', '')) {
  return {
    event_id: eventId,
    timestamp: new Date().toISOString(),
    level: 'error',
    platform: context.platform || 'node',
    environment: context.environment || undefined,
    release: context.release || undefined,
    exception: {
      values: [{
        type: error.name || 'Error',
        value: (error.message || String(error)).slice(0, MAX_MESSAGE),
        stacktrace: { frames: parseStack(error.stack) },
      }],
    },
    request: context.url
      ? { url: context.url.split('?')[0], method: context.method }
      : undefined,
  }
}

// The same error again within a minute counts once, and a runaway loop sends
// no more than a handful a minute.
export function createThrottle(now: () => number = Date.now, windowMs = 60_000, max = 20) {
  const seen = new Map<string, number>()
  let sent: number[] = []

  return (error: Error): boolean => {
    const at = now()
    const key = `${error.name}:${(error.message || '').slice(0, 200)}`

    sent = sent.filter(time => at - time < windowMs)
    for (const [known, time] of seen) {
      if (at - time >= windowMs) seen.delete(known)
    }
    if (seen.has(key) || sent.length >= max) return false

    seen.set(key, at)
    sent.push(at)

    return true
  }
}

// One event as a Sentry envelope: a header line, an item header, the event.
export function buildEnvelope(event: { event_id: string }): string {
  return [
    JSON.stringify({ event_id: event.event_id, sent_at: new Date().toISOString() }),
    JSON.stringify({ type: 'event' }),
    JSON.stringify(event),
  ].join('\n')
}

export async function sendEvent(dsn: ErrorDsn, event: { event_id: string }, send: typeof fetch = fetch): Promise<void> {
  try {
    await send(dsn.envelopeUrl, {
      method: 'POST',
      body: buildEnvelope(event),
      keepalive: true,
      signal: AbortSignal.timeout(5_000),
    })
  }
  catch {
    // Reporting must never make an error worse.
  }
}

// What is thrown is not always an Error (a rejected string, an event).
export function toError(value: unknown): Error | null {
  if (value instanceof Error) return value

  if (typeof value === 'string' && value.trim()) return new Error(value)

  return null
}

// Browser noise that is not the site's fault: cross-origin scripts that hide
// their message, and a harmless layout notification.
const IGNORED_MESSAGES = /^(Script error\.?|ResizeObserver loop)/

export function isIgnoredBrowserError(error: Error, source?: string, origin?: string): boolean {
  if (IGNORED_MESSAGES.test(error.message)) return true

  // A script from another site or an extension, not from this one.
  return Boolean(source && origin && !source.startsWith(origin))
}
