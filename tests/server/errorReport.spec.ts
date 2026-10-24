import { describe, expect, it, vi } from 'vitest'
import {
  buildEnvelope,
  buildEvent,
  createThrottle,
  isAutomatedVisitor,
  isIgnoredBrowserError,
  parseDsn,
  parseStack,
  sendEvent,
  shouldReport,
  toError,
} from '../../layers/errors/utils/errorReport'

describe('error report DSN', () => {
  it('reads GlitchTip addresses', () => {
    expect(parseDsn('https://abc123@errors.example.com/7')).toEqual({
      key: 'abc123',
      envelopeUrl: 'https://errors.example.com/api/7/envelope/?sentry_version=7&sentry_key=abc123&sentry_client=stir-errors%2F1',
    })
    expect(parseDsn('http://k@127.0.0.1:8002/12')?.envelopeUrl).toContain('http://127.0.0.1:8002/api/12/envelope/?')
  })

  it.each([undefined, '', 'not a url', 'ftp://k@host/1', 'https://host/1', 'https://k@host/', 'https://k@host/abc'])(
    'refuses %s',
    (value) => expect(parseDsn(value)).toBeNull(),
  )
})

describe('error report stack', () => {
  it('parses V8 frames, oldest call first', () => {
    const stack = [
      'TypeError: x is undefined',
      '    at render (file:///srv/app/.output/server/chunks/app.mjs:10:5)',
      '    at /srv/app/.output/server/index.mjs:3:9',
      '    at async file:///Users/me/My%20Site/.output/server/chunks/nitro.mjs:7:2',
    ].join('\n')

    expect(parseStack(stack)).toEqual([
      { function: undefined, filename: '/Users/me/My Site/.output/server/chunks/nitro.mjs', lineno: 7, colno: 2 },
      { function: undefined, filename: '/srv/app/.output/server/index.mjs', lineno: 3, colno: 9 },
      { function: 'render', filename: '/srv/app/.output/server/chunks/app.mjs', lineno: 10, colno: 5 },
    ])
    expect(parseStack(undefined)).toEqual([])
  })
})

describe('error report policy', () => {
  it('reports server faults, not missing or refused pages', () => {
    expect(shouldReport(new Error('boom'))).toBe(true)
    expect(shouldReport({ statusCode: 500 })).toBe(true)
    expect(shouldReport({ statusCode: 404 })).toBe(false)
    expect(shouldReport({ statusCode: 403 })).toBe(false)
  })

  it('drops the query string and sends no headers or cookies', () => {
    const event = buildEvent(new RangeError('too deep'), {
      url: '/search?q=secret&token=abc',
      method: 'GET',
      environment: 'production',
      release: 'abc1234',
    }, 'e'.repeat(32))

    expect(event).toMatchObject({
      event_id: 'e'.repeat(32),
      level: 'error',
      platform: 'node',
      environment: 'production',
      release: 'abc1234',
      request: { url: '/search', method: 'GET' },
    })
    expect(event.exception.values[0]).toMatchObject({ type: 'RangeError', value: 'too deep' })
    expect(JSON.stringify(event)).not.toContain('secret')
  })

  it('counts the same error once a minute and caps a runaway', () => {
    let now = 0
    const allow = createThrottle(() => now, 60_000, 3)

    expect(allow(new Error('a'))).toBe(true)
    expect(allow(new Error('a'))).toBe(false)
    expect(allow(new Error('b'))).toBe(true)
    expect(allow(new Error('c'))).toBe(true)
    expect(allow(new Error('d'))).toBe(false)
    now = 61_000
    expect(allow(new Error('a'))).toBe(true)
  })
})

describe('error report delivery', () => {
  it('posts a three-line envelope with the key in the address and no headers', async () => {
    const dsn = parseDsn('https://abc@errors.example.com/7')!
    const ok = vi.fn().mockResolvedValue(new Response(null, { status: 200 }))

    await sendEvent(dsn, { event_id: 'e'.repeat(32) }, ok)

    const [url, init] = ok.mock.calls[0]!

    expect(url).toContain('/api/7/envelope/?sentry_version=7&sentry_key=abc')
    expect(init.headers).toBeUndefined()
    expect(init.body.split('\n').map((line: string) => Object.keys(JSON.parse(line))[0])).toEqual(['event_id', 'type', 'event_id'])
    expect(buildEnvelope({ event_id: 'x' }).split('\n')).toHaveLength(3)
    await expect(sendEvent(dsn, { event_id: 'x' }, vi.fn().mockRejectedValue(new Error('down')))).resolves.toBeUndefined()
  })
})

describe('browser errors', () => {
  it('reads errors and strings, not events', () => {
    const error = new Error('x')

    expect(toError(error)).toBe(error)
    expect(toError('boom')?.message).toBe('boom')
    expect(toError({ type: 'error' })).toBeNull()
    expect(toError('  ')).toBeNull()
  })

  it('ignores cross-origin noise and scripts that are not the site\'s', () => {
    const origin = 'https://www.example.com'

    expect(isIgnoredBrowserError(new Error('Script error.'), '', origin)).toBe(true)
    expect(isIgnoredBrowserError(new Error('ResizeObserver loop completed'), origin, origin)).toBe(true)
    expect(isIgnoredBrowserError(new Error('x'), 'chrome-extension://abc/inject.js', origin)).toBe(true)
    expect(isIgnoredBrowserError(new Error('x'), `${origin}/_nuxt/app.js`, origin)).toBe(false)
    expect(isIgnoredBrowserError(new Error('x'), undefined, origin)).toBe(false)
  })

  it('parses Firefox and Safari stacks', () => {
    expect(parseStack('render@https://www.example.com/_nuxt/app.js:10:5\n@https://www.example.com/_nuxt/entry.js:3:9')).toEqual([
      { function: undefined, filename: 'https://www.example.com/_nuxt/entry.js', lineno: 3, colno: 9 },
      { function: 'render', filename: 'https://www.example.com/_nuxt/app.js', lineno: 10, colno: 5 },
    ])
  })
})

describe('automated visitors', () => {
  const chrome = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'

  it('skips crawlers, page checkers and automation', () => {
    for (const userAgent of [
      'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      'Mozilla/5.0 (compatible; bingbot/2.0)',
      'Mozilla/5.0 (compatible; Yahoo! Slurp)',
      'Mozilla/5.0 (X11; Linux x86_64) Chrome-Lighthouse',
      'Mozilla/5.0 (Linux; Android 11) AppleWebKit/537.36 Chrome/130 Mobile Safari/537.36 Google-PageSpeed Insights',
      'Mozilla/5.0 HeadlessChrome/130.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Unknown; Linux x86_64) AppleWebKit/538.1 PhantomJS/2.1.1 Safari/538.1',
      'facebookexternalhit/1.1',
      'Mozilla/5.0 (compatible; SomeSpider/1.0; +crawl)',
      'Prerender (+https://github.com/prerender/prerender)',
      'LinkPreview/1.0',
    ]) {
      expect(isAutomatedVisitor(userAgent, false), userAgent).toBe(true)
    }

    expect(isAutomatedVisitor(chrome, true)).toBe(true)
  })

  it('still reports normal browsers, including a failed chunk import', () => {
    for (const userAgent of [
      chrome,
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:132.0) Gecko/20100101 Firefox/132.0',
      '',
    ]) {
      expect(isAutomatedVisitor(userAgent, false), userAgent).toBe(false)
    }

    expect(isAutomatedVisitor(undefined, undefined)).toBe(false)

    const chunkError = new Error('Failed to fetch dynamically imported module: https://www.example.com/_nuxt/abc.js')

    expect(isIgnoredBrowserError(chunkError, 'https://www.example.com/_nuxt/entry.js', 'https://www.example.com')).toBe(false)
  })

  it('counts a chunk failure once when Nuxt, the window and Vue all raise it', () => {
    const allow = createThrottle(() => 1_000)
    const chunkError = new Error('Failed to fetch dynamically imported module: https://www.example.com/_nuxt/abc.js')

    expect([allow(chunkError), allow(chunkError), allow(chunkError)]).toEqual([true, false, false])
  })
})
