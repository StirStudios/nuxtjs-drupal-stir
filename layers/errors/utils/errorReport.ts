// Reports errors to GlitchTip (Sentry-compatible) through its envelope
// endpoint with a plain fetch, on the server and in the browser: the Sentry
// SDKs pull in far more code than reporting an error needs (the browser one
// is about 140 kB gzipped, the Node one brings OpenTelemetry). Only the path
// leaves the page or the server (never the query string, headers, cookies or
// request bodies), and the key travels in the query string, as the SDKs send
// it, so a browser makes no CORS preflight request.

import { readStirDrupalMaintenanceMessage } from '../../foundation/shared/utils/drupalMaintenance'

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
  extra?: Record<string, unknown>
  // Already parsed by the caller, so the stack is read once.
  frames?: StackFrame[]
  // Sent only for a failed module load, where the browser is the question.
  userAgent?: string
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

// A page not found or refused is not a fault of the site, and neither is the
// CMS's Maintenance mode during a deploy.
export function shouldReport(error: unknown): boolean {
  const status = (error as { statusCode?: number } | null)?.statusCode

  return (typeof status !== 'number' || status >= 500) && !isDrupalMaintenance(error)
}

type MaybeMaintenance = {
  data?: { maintenanceMessage?: unknown, data?: { maintenanceMessage?: unknown } }
  cause?: unknown
} | null

// Drupal in Maintenance mode answers with its message as plain text, which
// the layer passes on as data.maintenanceMessage: on a route's own error, or
// in the JSON error body a fetch of that route received. A fetch of Drupal
// itself that the route lets through carries the plain text as its data. A
// CMS that is down answers with a proxy's HTML page or an empty body, so it is
// still reported.
export function isDrupalMaintenance(error: unknown, depth = 0): boolean {
  const data = (error as MaybeMaintenance)?.data
  const message = data?.maintenanceMessage ?? data?.data?.maintenanceMessage

  if (typeof message === 'string' && message.trim()) return true
  if (
    (error as { statusCode?: unknown } | null)?.statusCode === 503
    && readStirDrupalMaintenanceMessage(data)
  ) return true

  return depth < 2 && Boolean((error as MaybeMaintenance)?.cause) && isDrupalMaintenance((error as MaybeMaintenance)!.cause, depth + 1)
}

export interface ErrorCause {
  name: string
  code?: string
  message: string
}

// A proxy's "Bad Gateway" says only that the fetch threw; the reason (a reset
// socket, a connect timeout) is in its cause, and undici nests one more.
export function describeCauses(error: unknown, depth = 3): ErrorCause[] {
  const causes: ErrorCause[] = []
  let cause = (error as { cause?: unknown } | null)?.cause

  while (cause && causes.length < depth) {
    const { name, code, message } = cause as { name?: unknown, code?: unknown, message?: unknown }

    causes.push({
      name: typeof name === 'string' && name ? name : 'Error',
      code: typeof code === 'string' ? code : undefined,
      message: String(typeof message === 'string' ? message : cause).slice(0, MAX_MESSAGE),
    })
    cause = (cause as { cause?: unknown }).cause
  }

  return causes
}

export interface UpstreamResponse {
  status: number
  server?: string
  cfRay?: string
  cfCacheStatus?: string
  body?: string
}

const MAX_UPSTREAM_BODY = 200

// Who answered a failed CMS fetch, Cloudflare or the origin behind it: its
// server and Cloudflare headers and the start of its body. No other header
// is kept, so cookies and credentials never leave.
export function describeUpstreamResponse(error: unknown, depth = 3): UpstreamResponse | undefined {
  let current = error

  for (let level = 0; current && level <= depth; level++) {
    const { response, data } = current as { response?: { status?: unknown, headers?: { get?: unknown } }, data?: unknown }
    const get = response?.headers?.get

    if (typeof response?.status === 'number' && typeof get === 'function') {
      const header = (name: string) => (get.call(response!.headers, name) as string | null) || undefined
      const body = typeof data === 'string' ? data : data === undefined ? '' : JSON.stringify(data)

      return {
        status: response.status,
        server: header('server'),
        cfRay: header('cf-ray'),
        cfCacheStatus: header('cf-cache-status'),
        body: body ? body.slice(0, MAX_UPSTREAM_BODY) : undefined,
      }
    }

    current = (current as { cause?: unknown }).cause
  }

  return undefined
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
        stacktrace: { frames: context.frames ?? parseStack(error.stack) },
      }],
    },
    request: context.url
      ? {
          url: context.url.split('?')[0],
          method: context.method,
          headers: context.userAgent ? { 'User-Agent': context.userAgent } : undefined,
        }
      : undefined,
    extra: context.extra,
  }
}

// The same error again within a minute counts once, and a runaway loop sends
// no more than a handful a minute.
export function createThrottle(
  now: () => number = Date.now,
  windowMs = 60_000,
  max = 20,
  keyOf: (error: Error) => string = error => `${error.name}:${(error.message || '').slice(0, 200)}`,
) {
  const seen = new Map<string, number>()
  let sent: number[] = []

  return (error: Error): boolean => {
    const at = now()
    const key = keyOf(error)

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

// One failure reaches the page by several routes (the window, Vue and Nuxt
// each raise it) and each may wrap it differently: a TypeError, an Error, a
// Nuxt error. The message is what they share, so the browser counts by that.
export const messageKey = (error: Error): string =>
  (error.message || '').trim().replace(/[.\s]+$/, '').slice(0, 200)

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

export interface SourceLocation {
  filename?: string
  lineno?: number
  colno?: number
}

// What is thrown is not always an Error (a rejected string, an event). An
// Error made here would carry this reporter's own stack, which sits in the
// site's scripts, so a string gets only the location the browser reported for
// it (a window error event names the script), or no frames at all.
export function toError(value: unknown, location?: SourceLocation): Error | null {
  if (value instanceof Error) return value

  if (typeof value !== 'string' || !value.trim()) return null

  const error = new Error(value)

  error.stack = location?.filename
    ? `Error: ${value}\n    at ${location.filename}:${location.lineno ?? 0}:${location.colno ?? 0}`
    : ''

  return error
}

// Browser noise that is not the site's fault: cross-origin scripts that hide
// their message, and a harmless layout notification. Where an error came from
// is judged by its frames (hasOwnFrame), which also follows a CDN.
const IGNORED_MESSAGES = /^(Script error\.?|ResizeObserver loop)/

export function isIgnoredBrowserError(error: Error): boolean {
  return IGNORED_MESSAGES.test(error.message)
}

// Crawlers, page checkers and automation: a script they give up loading is
// not a visitor's problem, and every connected site would collect them.
const AUTOMATED_USER_AGENT = /bot|crawl|spider|slurp|lighthouse|pagespeed|headlesschrome|phantomjs|prerender|facebookexternalhit|preview/i

export function isAutomatedVisitor(userAgent?: string, webdriver?: boolean): boolean {
  return webdriver === true || AUTOMATED_USER_AGENT.test(userAgent || '')
}

// Where this site's own built scripts live: the CDN when one is set, else the
// page's origin plus the base path, then the assets folder (/_nuxt/).
export function ownScriptsPrefix(
  app: { baseURL?: string, buildAssetsDir?: string, cdnURL?: string } | undefined,
  origin: string,
): string {
  const root = (app?.cdnURL || `${origin}${app?.baseURL || '/'}`).replace(/\/+$/, '')

  return `${root}/${(app?.buildAssetsDir || '/_nuxt/').replace(/^\/+/, '')}`
}

// Only an error with a frame in the site's own built scripts is the site's
// fault. Code that other pages inject (an in-app browser, an extension, a
// translator) shows the page address or another origin as its source, and an
// error with no frames at all (a failed script load, a thrown string) says
// nothing about our code either.
export function hasOwnFrame(frames: StackFrame[], prefix: string): boolean {
  return frames.some(frame => frame.filename.startsWith(prefix))
}

// A script or stylesheet that failed to load, as WebKit, Chrome and Firefox
// each word it, is the one error whose cause is not in our code.
const MODULE_LOAD_FAILURE = /dynamically imported module|importing a module script failed|loading chunk|unable to preload css/i

export function isModuleLoadFailure(error: Error): boolean {
  return MODULE_LOAD_FAILURE.test(error.message || '')
}

export interface ResourceEntry {
  name: string
  duration: number
  transferSize?: number
  decodedBodySize?: number
  responseStatus?: number
  nextHopProtocol?: string
}

const MAX_FAILED_FILES = 5

// Names the file behind a failed module load and how it travelled: the site's
// own scripts and stylesheets that came back with no body or an error status,
// the protocols (h2, h3) the site's files used, and the connection type where
// the browser reports one (Safari does not). File names only, no query
// string; nothing about the visitor.
export function describeModuleLoad(
  entries: ResourceEntry[],
  prefix: string,
  connection?: { effectiveType?: string, type?: string, saveData?: boolean },
  requested: string[] = [],
): Record<string, unknown> {
  const own = entries.filter(entry => entry.name.startsWith(prefix))
  const fileOf = (url: string) => url.slice(prefix.length).split(/[?#]/)[0]!
  // WebKit records no entry for a module fetch that failed or was cancelled,
  // so a file the page asked for (a modulepreload link) without an entry is
  // the one that never arrived.
  const completed = new Set(own.map(entry => fileOf(entry.name)))
  const missing = [...new Set(requested.filter(url => url.startsWith(prefix)).map(fileOf))]
    .filter(file => !completed.has(file))
  const failed = own.filter((entry) => {
    const status = entry.responseStatus

    return (typeof status === 'number' && status >= 400)
      || (!entry.decodedBodySize && !entry.transferSize && (status === 0 || status === undefined))
  })
  const protocols: Record<string, number> = {}

  for (const entry of own) {
    const protocol = entry.nextHopProtocol || 'unknown'

    protocols[protocol] = (protocols[protocol] || 0) + 1
  }

  return {
    ownFiles: own.length,
    failedFiles: failed.length,
    missingFiles: missing.length,
    missing: missing.slice(0, MAX_FAILED_FILES),
    failed: failed.slice(0, MAX_FAILED_FILES).map(entry => ({
      file: fileOf(entry.name),
      status: entry.responseStatus,
      protocol: entry.nextHopProtocol || undefined,
      ms: Math.round(entry.duration),
    })),
    protocols,
    connection: connection
      ? { effectiveType: connection.effectiveType, type: connection.type, saveData: connection.saveData }
      : undefined,
  }
}

// An app's own web view rather than a browser: an iPhone or iPad web view
// without Safari's token, or an app that names itself.
const IN_APP_BROWSER = /FBAN|FBAV|Instagram|GSA\/|\bLine\/|LinkedInApp|Snapchat|Pinterest|; wv\)/i

export function isInAppBrowser(userAgent = ''): boolean {
  return IN_APP_BROWSER.test(userAgent) || (/iPhone|iPad|iPod/.test(userAgent) && !/Safari\//.test(userAgent))
}

export interface PageState {
  visibility?: string
  online?: boolean
  msSinceStart?: number
  navigationType?: string
}

export interface BrowserReporterOptions {
  dsn: ErrorDsn
  ownScripts: string
  allowed: () => boolean
  pageUrl: () => string
  resources: () => ResourceEntry[]
  connection?: () => { effectiveType?: string, type?: string, saveData?: boolean } | undefined
  userAgent?: () => string
  // The module files the page asked for (modulepreload links).
  requestedModules?: () => string[]
  pageState?: () => PageState
  environment?: string
  release?: string
  now?: () => number
  send?: typeof fetch
}

// The browser's whole decision, from a raw thrown value to a sent event:
// consent, noise, the site's own frames, one failure counted once, and the
// file names behind a failed module load. The plugin only wires up the events.
export function createBrowserReporter(options: BrowserReporterOptions) {
  const allow = createThrottle(options.now, 60_000, 20, messageKey)

  return (value: unknown, location?: SourceLocation): void => {
    if (!options.allowed()) return

    const error = toError(value, location)

    if (!error || isIgnoredBrowserError(error) || isDrupalMaintenance(value)) return

    const frames = parseStack(error.stack)
    const moduleLoad = isModuleLoadFailure(error)
    const page = moduleLoad ? options.pageState?.() : undefined

    // A page left or backgrounded mid-load has its remaining fetches cancelled
    // by the browser; only a load that fails in view can be a real fault.
    if (page?.visibility === 'hidden') return
    if (!hasOwnFrame(frames, options.ownScripts) || !allow(error)) return

    // A failed module load also says which browser, what never arrived and
    // what the page was doing; other errors carry none of this.
    const userAgent = moduleLoad ? options.userAgent?.() : undefined

    void sendEvent(options.dsn, buildEvent(error, {
      platform: 'javascript',
      frames,
      url: options.pageUrl(),
      environment: options.environment,
      release: options.release,
      userAgent,
      extra: moduleLoad
        ? {
            ...describeModuleLoad(options.resources(), options.ownScripts, options.connection?.(), options.requestedModules?.()),
            inAppBrowser: isInAppBrowser(userAgent),
            page,
          }
        : undefined,
    }), options.send)
  }
}
