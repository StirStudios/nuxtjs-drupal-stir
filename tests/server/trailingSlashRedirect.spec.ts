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
  ])('strips the slash from %s', (path, target) => {
    expect(trailingSlashTarget(path)).toBe(target)
  })

  it.each([
    '/',
    '/articles',
    '/articles?next=/a/',
    '//evil.example/',
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
