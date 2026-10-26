import { describe, expect, it, vi } from 'vitest'
import {
  buildEnvelope,
  buildEvent,
  createBrowserReporter,
  createThrottle,
  describeModuleLoad,
  hasOwnFrame,
  isAutomatedVisitor,
  isIgnoredBrowserError,
  isModuleLoadFailure,
  messageKey,
  ownScriptsPrefix,
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

  it('gives a thrown string the location the browser reported, never this reporter\'s own stack', () => {
    // Made here, a plain new Error() would carry the reporter's frames, which
    // sit in the site's own scripts and would pass the own-script check.
    expect(toError('rejected')?.stack).toBe('')
    expect(parseStack(toError('rejected')?.stack)).toEqual([])
    expect(parseStack(toError('Uncaught boom', {
      filename: 'https://www.example.com/class/yoga',
      lineno: 229,
      colno: 12,
    })?.stack)).toEqual([
      { function: undefined, filename: 'https://www.example.com/class/yoga', lineno: 229, colno: 12 },
    ])
    expect(parseStack(toError('Uncaught boom', { filename: 'https://www.example.com/_nuxt/a.js', lineno: 1, colno: 2 })?.stack)[0]?.filename)
      .toBe('https://www.example.com/_nuxt/a.js')
  })

  it('ignores cross-origin noise and a harmless layout notification by message', () => {
    expect(isIgnoredBrowserError(new Error('Script error.'))).toBe(true)
    expect(isIgnoredBrowserError(new Error('ResizeObserver loop completed'))).toBe(true)
    expect(isIgnoredBrowserError(new Error('x'))).toBe(false)
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

  it('still treats normal browsers as visitors, and a chunk failure is not noise by message', () => {
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

    expect(isIgnoredBrowserError(chunkError)).toBe(false)
  })

  it('counts a chunk failure once when Nuxt, the window and Vue all raise it', () => {
    const allow = createThrottle(() => 1_000)
    const chunkError = new Error('Failed to fetch dynamically imported module: https://www.example.com/_nuxt/abc.js')

    expect([allow(chunkError), allow(chunkError), allow(chunkError)]).toEqual([true, false, false])
  })
})

describe('own scripts only', () => {
  const origin = 'https://www.example.com'
  const prefix = ownScriptsPrefix({ baseURL: '/', buildAssetsDir: '/_nuxt/' }, origin)
  const ownFrame = (error: Error) => hasOwnFrame(parseStack(error.stack), prefix)
  const errorWith = (stack: string, message = 'boom') => Object.assign(new Error(message), { stack })

  it('finds the built scripts on the page origin, a base path or a CDN', () => {
    expect(prefix).toBe('https://www.example.com/_nuxt/')
    expect(ownScriptsPrefix(undefined, origin)).toBe('https://www.example.com/_nuxt/')
    expect(ownScriptsPrefix({ baseURL: '/shop/', buildAssetsDir: '/_nuxt/' }, origin)).toBe('https://www.example.com/shop/_nuxt/')
    expect(ownScriptsPrefix({ cdnURL: 'https://cdn.example.com/', buildAssetsDir: '_assets/' }, origin)).toBe('https://cdn.example.com/_assets/')
  })

  it('reports an exception thrown from the site\'s own script', () => {
    expect(ownFrame(errorWith('TypeError: x is undefined\n    at render (https://www.example.com/_nuxt/Cx4f2a.js:10:5)\n    at https://www.example.com/_nuxt/entry.js:3:9'))).toBe(true)
    expect(ownFrame(errorWith('render@https://www.example.com/_nuxt/Cx4f2a.js:10:5'))).toBe(true)
    // One frame of ours among others is enough.
    expect(ownFrame(errorWith('Error: x\n    at Hk (https://www.example.com/:229:3)\n    at run (https://www.example.com/_nuxt/entry.js:3:9)'))).toBe(true)
  })

  it('drops errors from injected scripts, extensions and other origins', () => {
    // An in-app browser's script: its source is the page address itself.
    expect(ownFrame(errorWith('RangeError: Maximum call stack size exceeded\n    at Hk (https://www.example.com/class/yoga:229:12)\n    at Fk (https://www.example.com/class/yoga:229:40)'))).toBe(false)
    expect(ownFrame(errorWith('Error: x\n    at a (chrome-extension://abc/inject.js:1:1)'))).toBe(false)
    expect(ownFrame(errorWith('Error: x\n    at a (https://cdn.other.com/_nuxt/app.js:1:1)'))).toBe(false)
    // A look-alike path on our own origin is not a built script.
    expect(ownFrame(errorWith('Error: x\n    at a (https://www.example.com/not_nuxt/app.js:1:1)'))).toBe(false)
  })

  it('keeps a failed module import whose stack has frames in the site\'s scripts', () => {
    // The two frames of a real iPhone in-app browser report, with the message
    // WebKit gives a failed import(). The drop below is by frames, never by message.
    const message = 'Importing a module script failed.'
    const webkit = errorWith(
      'a@https://www.example.com/_nuxt/BmIMsDnx.js:2:67390\nb@https://www.example.com/_nuxt/CRzLMJPS.js:1:1505',
      message,
    )

    expect(ownFrame(webkit)).toBe(true)
    expect(ownFrame(errorWith('at a (https://www.example.com/_nuxt/BmIMsDnx.js:2:67390)\n    at b (https://www.example.com/_nuxt/CRzLMJPS.js:1:1505)', message))).toBe(true)
    expect(isIgnoredBrowserError(webkit)).toBe(false)
    expect(buildEvent(webkit, { platform: 'javascript' }).exception.values[0]!.stacktrace.frames.map(frame => frame.filename)).toEqual([
      'https://www.example.com/_nuxt/CRzLMJPS.js',
      'https://www.example.com/_nuxt/BmIMsDnx.js',
    ])
  })

  it('drops errors with no frames, including failed script loads', () => {
    expect(ownFrame(errorWith(''))).toBe(false)
    expect(ownFrame(new Error('rejected string'))).toBe(false)
    expect(ownFrame(errorWith('TypeError: Failed to fetch dynamically imported module: https://www.example.com/_nuxt/abc.js'))).toBe(false)
    expect(ownFrame(errorWith('TypeError: Importing a module script failed.'))).toBe(false)
  })
})

describe('one failure, several handlers', () => {
  it('counts the browser\'s window, Vue and Nuxt reports of one failure once, whatever they wrap it as', () => {
    let now = 1_000
    const allow = createThrottle(() => now, 60_000, 20, messageKey)
    const message = 'Importing a module script failed.'

    // A rejected promise gives a TypeError; Nuxt hands over its own wrapped error.
    expect(allow(new TypeError(message))).toBe(true)
    expect(allow(Object.assign(new Error(message), { name: 'NuxtError' }))).toBe(false)
    expect(allow(new Error(`${message} `))).toBe(false)
    expect(allow(new Error('Importing a module script failed'))).toBe(false)

    // A different failure still counts, and the same one counts again after the window.
    expect(allow(new Error('x is not a function'))).toBe(true)
    now += 61_000
    expect(allow(new TypeError(message))).toBe(true)
  })

  it('keeps the server\'s count by name and message', () => {
    const allow = createThrottle(() => 1_000)

    expect(allow(new TypeError('boom'))).toBe(true)
    expect(allow(new Error('boom'))).toBe(true)
    expect(allow(new TypeError('boom'))).toBe(false)
  })
})

describe('failed module load diagnostics', () => {
  const prefix = 'https://www.example.com/_nuxt/'
  const entry = (file: string, extra: Record<string, unknown> = {}) => ({
    name: `${prefix}${file}`,
    duration: 120.4,
    transferSize: 1500,
    decodedBodySize: 4000,
    responseStatus: 200,
    nextHopProtocol: 'h2',
    ...extra,
  })

  it('recognizes the module load failures of the three engines, and nothing else', () => {
    for (const message of [
      'Importing a module script failed.',
      'Failed to fetch dynamically imported module: https://www.example.com/_nuxt/a.js',
      'error loading dynamically imported module: https://www.example.com/_nuxt/a.js',
      'Loading chunk 12 failed.',
      'Unable to preload CSS for /_nuxt/entry.css',
    ]) {
      expect(isModuleLoadFailure(new Error(message)), message).toBe(true)
    }

    expect(isModuleLoadFailure(new Error('x is not a function'))).toBe(false)
    expect(isModuleLoadFailure(new Error(''))).toBe(false)
  })

  it('names the files that failed, with no query string', () => {
    const result = describeModuleLoad([
      entry('ok.js'),
      entry('missing.js?v=abc#frag', { responseStatus: 404, transferSize: 300, decodedBodySize: 0, nextHopProtocol: 'h3' }),
      entry('dropped.js', { responseStatus: 0, transferSize: 0, decodedBodySize: 0 }),
      entry('no-status.js', { responseStatus: undefined, transferSize: 0, decodedBodySize: 0 }),
    ], prefix)

    expect(result.failedFiles).toBe(3)
    expect(result.failed).toEqual([
      { file: 'missing.js', status: 404, protocol: 'h3', ms: 120 },
      { file: 'dropped.js', status: 0, protocol: 'h2', ms: 120 },
      { file: 'no-status.js', status: undefined, protocol: 'h2', ms: 120 },
    ])
  })

  it('does not count a cached file, other origins or other folders as failed', () => {
    const result = describeModuleLoad([
      entry('cached.js', { transferSize: 0, decodedBodySize: 9000 }),
      { ...entry('x.js'), name: 'https://cdn.other.com/_nuxt/x.js', responseStatus: 500 },
      { ...entry('y.js'), name: 'https://www.example.com/api/y.js', responseStatus: 500 },
    ], prefix)

    expect(result).toMatchObject({ ownFiles: 1, failedFiles: 0, failed: [] })
  })

  it('reports how the site\'s files travelled, at most five failed names, and the connection when there is one', () => {
    const entries = [
      ...Array.from({ length: 8 }, (_, index) => entry(`f${index}.js`, { responseStatus: 0, transferSize: 0, decodedBodySize: 0, nextHopProtocol: index % 2 ? 'h3' : 'h2' })),
      entry('fine.js', { nextHopProtocol: '' }),
    ]
    const result = describeModuleLoad(entries, prefix, { effectiveType: '4g', type: 'cellular', saveData: false })

    expect(result.ownFiles).toBe(9)
    expect(result.failedFiles).toBe(8)
    expect(result.failed).toHaveLength(5)
    expect(result.protocols).toEqual({ h2: 4, h3: 4, unknown: 1 })
    expect(result.connection).toEqual({ effectiveType: '4g', type: 'cellular', saveData: false })
    expect(describeModuleLoad([], prefix).connection).toBeUndefined()
  })

  it('goes on the event as extra data only when given', () => {
    const error = new Error('Importing a module script failed.')

    expect(buildEvent(error, { platform: 'javascript', extra: { failedFiles: 1 } }).extra).toEqual({ failedFiles: 1 })
    expect(JSON.parse(JSON.stringify(buildEvent(error, { platform: 'javascript' }))).extra).toBeUndefined()
  })
})

describe('browser report pipeline', () => {
  const page = 'https://www.example.com'
  const ownScripts = `${page}/_nuxt/`
  const dsn = parseDsn('https://key@errors.example.com/7')!
  const thrownAt = (message: string, file: string, name = 'Error') =>
    Object.assign(new Error(message), { name, stack: `${name}: ${message}\n    at run (${file}:1:2)` })

  function setup(overrides: { allowed?: boolean, resources?: ResourceEntryLike[] } = {}) {
    const send = vi.fn().mockResolvedValue(new Response(null, { status: 200 }))
    let now = 1_000
    const report = createBrowserReporter({
      dsn,
      ownScripts,
      allowed: () => overrides.allowed ?? true,
      pageUrl: () => `${page}/class/yoga`,
      resources: () => overrides.resources ?? [],
      connection: () => ({ effectiveType: '4g' }),
      now: () => now,
      send: send as unknown as typeof fetch,
    })
    const sent = () => send.mock.calls.map(([, init]) =>
      JSON.parse((init as RequestInit).body!.toString().split('\n')[2]!))

    return { report, sent, later: (ms: number) => { now += ms } }
  }

  type ResourceEntryLike = Parameters<typeof describeModuleLoad>[0][number]

  it('sends an error thrown from the site\'s own scripts, without the query string', () => {
    const { report, sent } = setup()

    report(thrownAt('x is undefined', `${ownScripts}entry.js`))

    expect(sent()).toHaveLength(1)
    expect(sent()[0]).toMatchObject({
      platform: 'javascript',
      request: { url: `${page}/class/yoga` },
      exception: { values: [{ type: 'Error', value: 'x is undefined' }] },
    })
    expect(sent()[0].exception.values[0].stacktrace.frames[0].filename).toBe(`${ownScripts}entry.js`)
    expect(sent()[0].extra).toBeUndefined()
  })

  it('sends nothing without consent', () => {
    const { report, sent } = setup({ allowed: false })

    report(thrownAt('x is undefined', `${ownScripts}entry.js`))

    expect(sent()).toHaveLength(0)
  })

  it('drops thrown strings unless the browser placed them in the site\'s own scripts', () => {
    const { report, sent } = setup()

    report('rejected by an injected script')
    report('Uncaught boom', { filename: `${page}/class/yoga`, lineno: 229, colno: 12 })
    report('Uncaught boom', { filename: 'chrome-extension://abc/inject.js', lineno: 1, colno: 1 })
    expect(sent()).toHaveLength(0)

    report('Uncaught ours', { filename: `${ownScripts}entry.js`, lineno: 3, colno: 9 })
    expect(sent()).toHaveLength(1)
    expect(sent()[0].exception.values[0].value).toBe('Uncaught ours')
  })

  it('drops injected code, extensions and noise', () => {
    const { report, sent } = setup()

    report(thrownAt('Maximum call stack size exceeded', `${page}/class/yoga`, 'RangeError'))
    report(thrownAt('x', 'chrome-extension://abc/inject.js'))
    report(new Error('Script error.'))
    report({ type: 'error' })

    expect(sent()).toHaveLength(0)
  })

  it('counts one failure once across handlers, and again after the window', () => {
    const { report, sent, later } = setup()
    const message = 'Importing a module script failed.'

    report(thrownAt(message, `${ownScripts}BmIMsDnx.js`, 'TypeError'))
    report(thrownAt(message, `${ownScripts}CRzLMJPS.js`, 'Error'))
    expect(sent()).toHaveLength(1)

    later(61_000)
    report(thrownAt(message, `${ownScripts}BmIMsDnx.js`, 'TypeError'))
    expect(sent()).toHaveLength(2)
  })

  it('names the failed file on a module load failure', () => {
    const { report, sent } = setup({
      resources: [
        { name: `${ownScripts}ok.js`, duration: 10, transferSize: 900, decodedBodySize: 2000, responseStatus: 200, nextHopProtocol: 'h3' },
        { name: `${ownScripts}gone.js?v=1`, duration: 40, transferSize: 0, decodedBodySize: 0, responseStatus: 0, nextHopProtocol: 'h3' },
      ],
    })

    report(thrownAt('Importing a module script failed.', `${ownScripts}BmIMsDnx.js`, 'TypeError'))

    expect(sent()[0].extra).toEqual({
      ownFiles: 2,
      failedFiles: 1,
      failed: [{ file: 'gone.js', status: 0, protocol: 'h3', ms: 40 }],
      protocols: { h3: 2 },
      connection: { effectiveType: '4g' },
    })
  })
})
