import { afterEach, describe, expect, it, vi } from 'vitest'
import trailingSlashRedirect, { trailingSlashTarget } from '../../layers/seo/server/middleware/trailing-slash-redirect'

const createEvent = (path: string, method = 'GET') => {
  const headers = new Map<string, string | string[]>()
  const res = {
    end: vi.fn(),
    getHeader: (name: string) => headers.get(name.toLowerCase()),
    setHeader: (name: string, value: string | string[]) => {
      headers.set(name.toLowerCase(), value)
    },
    statusCode: 200,
  }

  return {
    event: {
      context: {},
      method,
      path,
      node: { req: { headers: { host: 'www.example.com' }, originalUrl: path, url: path }, res },
    },
    headers,
    res,
  }
}

describe('trailingSlashTarget', () => {
  it.each([
    ['/articles/', '/articles'],
    ['/some/path/', '/some/path'],
    ['/some/path//', '/some/path'],
    ['/articles/?page=2&sort=new', '/articles?page=2&sort=new'],
    // Encoded characters stay as sent; decoded ones are encoded for the header.
    ['/events/pop-%E2%80%A2-fizz/', '/events/pop-%E2%80%A2-fizz'],
    ['/events/pop-\u2022-fizz/', '/events/pop-%E2%80%A2-fizz'],
    ['/caf\u00e9/?q=cr\u00e8me br\u00fbl\u00e9e', '/caf%C3%A9?q=cr%C3%A8me%20br%C3%BBl%C3%A9e'],
    ['/emoji-\u{1F600}/', '/emoji-%F0%9F%98%80'],
  ])('strips the slash from %s', (path, target) => {
    expect(trailingSlashTarget(path)).toBe(target)
  })

  it.each([
    '/',
    '/articles',
    '/articles?next=/a/',
    '//evil.example/',
    '/\\evil.example/',
    '/%5Cevil.example/',
    '/%2Fevil.example/',
    '/a\\b/',
    '/_nuxt/abc/',
    '/_ipx/w_100/',
    '/__nuxt_error/',
    '/api/menu/',
    '/api/',
    '/ce-api/node/1/',
    '/sitemap.xml/',
  ])('leaves %s alone', (path) => {
    expect(trailingSlashTarget(path)).toBeUndefined()
  })

  it('still redirects pages whose first segment only starts like an API prefix', () => {
    expect(trailingSlashTarget('/apiary/')).toBe('/apiary')
  })
})

describe('trailing-slash middleware', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('answers 301 with the canonical location', async () => {
    vi.stubGlobal('useRuntimeConfig', vi.fn().mockReturnValue({ trailingSlashRedirect: true }))
    const { event, headers, res } = createEvent('/articles/?page=2')

    await trailingSlashRedirect(event as never)

    expect(res.statusCode).toBe(301)
    expect(headers.get('location')).toBe('/articles?page=2')
  })

  it('answers 301, not 500, for a path with a decoded non-ASCII character', async () => {
    vi.stubGlobal('useRuntimeConfig', vi.fn().mockReturnValue({ trailingSlashRedirect: true }))
    const { event, headers, res } = createEvent('/events/pop-\u2022-fizz/')

    await trailingSlashRedirect(event as never)

    expect(res.statusCode).toBe(301)
    expect(headers.get('location')).toBe('/events/pop-%E2%80%A2-fizz')
  })

  it('does nothing when a site opts out', async () => {
    vi.stubGlobal('useRuntimeConfig', vi.fn().mockReturnValue({ trailingSlashRedirect: false }))
    const { event, headers } = createEvent('/articles/')

    await trailingSlashRedirect(event as never)

    expect(headers.get('location')).toBeUndefined()
  })

  it('leaves non-GET requests alone', async () => {
    vi.stubGlobal('useRuntimeConfig', vi.fn().mockReturnValue({ trailingSlashRedirect: true }))
    const { event, headers } = createEvent('/form/', 'POST')

    await trailingSlashRedirect(event as never)

    expect(headers.get('location')).toBeUndefined()
  })
})
