import { afterEach, describe, expect, it, vi } from 'vitest'
import drupalOneTimeLoginRedirect from '../../layers/foundation/server/middleware/drupal-one-time-login-redirect'

const tokenPath = `/user/reset/1/1784408905/${'a'.repeat(43)}/login`

const createEvent = (path: string, host = 'www.example.test') => {
  const headers = new Map<string, string | string[]>()

  return {
    event: {
      context: {},
      method: 'GET',
      path,
      node: {
        req: {
          headers: { host, 'x-forwarded-proto': 'https' },
          originalUrl: path,
          url: path,
        },
        res: {
          end: vi.fn(),
          getHeader: (name: string) => headers.get(name.toLowerCase()),
          setHeader: (name: string, value: string | string[]) => {
            headers.set(name.toLowerCase(), value)
          },
          statusCode: 200,
        },
      },
    },
    headers,
  }
}

describe('Drupal one-time login handoff', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('redirects only a signed one-time-login path to Drupal', async () => {
    vi.stubGlobal('useRuntimeConfig', vi.fn().mockReturnValue({
      api: 'https://cms.example.test',
      public: {},
    }))
    const { event, headers } = createEvent(`${tokenPath}?destination=/admin`)

    await drupalOneTimeLoginRedirect(event as never)

    expect(headers.get('location')).toBe(
      `https://cms.example.test${tokenPath}?destination=/admin`,
    )
    expect(headers.get('cache-control')).toBe('private, no-store, max-age=0')
    expect(event.node.res.statusCode).toBe(302)
  })

  it.each([
    '/user/login',
    '/user/password',
    '/user/reset/1/1784408905/not.valid/login',
    '/user/reset/1/1784408905/token/edit',
  ])('does not redirect an unrelated account path: %s', async (path) => {
    vi.stubGlobal('useRuntimeConfig', vi.fn().mockReturnValue({
      api: 'https://cms.example.test',
      public: {},
    }))
    const { event, headers } = createEvent(path)

    await drupalOneTimeLoginRedirect(event as never)

    expect(headers.has('location')).toBe(false)
  })

  it('does not loop when Nuxt and Drupal share an origin', async () => {
    vi.stubGlobal('useRuntimeConfig', vi.fn().mockReturnValue({
      api: 'https://www.example.test',
      public: {},
    }))
    const { event, headers } = createEvent(tokenPath)

    await drupalOneTimeLoginRedirect(event as never)

    expect(headers.has('location')).toBe(false)
  })
})
