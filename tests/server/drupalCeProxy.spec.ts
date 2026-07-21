import { afterEach, describe, expect, it, vi } from 'vitest'
import { proxyRequest } from 'h3'
import {
  createStirDrupalProxyFetch,
  getStirDrupalCeProxyTargets,
  handleStirDrupalProxyResponse,
  isStirDrupalMenuProxyPathAllowed,
  isStirDrupalProxyPathSafe,
  proxyStirDrupalMenuRequest,
} from '../../layers/core/server/utils/drupalCeProxy'
import { replaceStirDrupalSetCookies } from '../../layers/foundation/server/utils/stirDrupalApi'

vi.mock('h3', async (importOriginal) => ({
  ...(await importOriginal<typeof import('h3')>()),
  proxyRequest: vi.fn(),
}))

const SESSION_NAME = `SSESS${'a'.repeat(32)}`

const createEvent = (cookie = '', url = '/') => {
  const responseHeaders = new Map<string, string | string[]>()

  return {
    event: {
      context: {},
      method: 'GET',
      path: url,
      node: {
        req: {
          headers: cookie ? { cookie } : {},
          method: 'GET',
          url,
        },
        res: {
          getHeader: (name: string) => responseHeaders.get(name.toLowerCase()),
          removeHeader: (name: string) => responseHeaders.delete(name.toLowerCase()),
          setHeader: (name: string, value: string | string[]) => {
            responseHeaders.set(name.toLowerCase(), value)
          },
        },
      },
    } as never,
    responseHeaders,
  }
}

const stubRuntimeConfig = (
  overrides: Record<string, unknown> = {},
): void => {
  vi.stubGlobal('useRuntimeConfig', vi.fn().mockReturnValue({
    api: 'https://cms.example.test',
    apiKey: 'server-api-key',
    public: {
      api: 'https://cms.example.test',
      drupalCe: {
        ceApiEndpoint: '/ce-api',
        drupalBaseUrl: 'https://cms.example.test',
        menuBaseUrl: 'https://menus.example.test',
        serverApiProxy: true,
      },
    },
    ...overrides,
  }))
}

describe('Drupal CE proxy boundary', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('resolves the configured CE and menu targets', () => {
    stubRuntimeConfig()

    expect(getStirDrupalCeProxyTargets()).toEqual({
      ceBaseUrl: 'https://cms.example.test/ce-api',
      menuBaseUrl: 'https://menus.example.test',
    })
  })

  it('preserves deployment-time Drupal CE origin overrides', () => {
    stubRuntimeConfig({
      api: 'https://build-time.example.test',
      public: {
        api: 'https://build-time.example.test',
        drupalCe: {
          ceApiEndpoint: '/custom-ce',
          drupalBaseUrl: 'https://runtime.example.test',
          menuBaseUrl: 'https://runtime-menu.example.test',
          serverApiProxy: true,
        },
      },
    })

    expect(getStirDrupalCeProxyTargets()).toEqual({
      ceBaseUrl: 'https://runtime.example.test/custom-ce',
      menuBaseUrl: 'https://runtime-menu.example.test',
    })
  })

  it('forwards only the Drupal session cookie and server API key', async () => {
    stubRuntimeConfig()
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}'))

    vi.stubGlobal('fetch', fetchMock)

    const { event } = createEvent(
      `analytics=secret; ${SESSION_NAME}=session-value`,
    )
    const proxyFetch = createStirDrupalProxyFetch(event)

    await proxyFetch('https://cms.example.test/ce-api/about', {
      headers: {
        cookie: 'protected_access=secret',
        forwarded: 'for=203.0.113.10;proto=http',
        'x-api-key': 'client-supplied-key',
        'x-forwarded-for': '203.0.113.10',
        'x-forwarded-host': 'attacker.example.test',
        'x-forwarded-port': '80',
        'x-forwarded-proto': 'http',
        'x-real-ip': '203.0.113.10',
        'x-request-id': 'request-id',
      },
    })

    const requestHeaders = new Headers(fetchMock.mock.calls[0]?.[1]?.headers)

    expect(requestHeaders.get('cookie')).toBe(
      `${SESSION_NAME}=session-value`,
    )
    expect(requestHeaders.get('x-api-key')).toBe('server-api-key')
    expect(requestHeaders.has('forwarded')).toBe(false)
    expect(requestHeaders.has('x-forwarded-for')).toBe(false)
    expect(requestHeaders.has('x-forwarded-host')).toBe(false)
    expect(requestHeaders.has('x-forwarded-port')).toBe(false)
    expect(requestHeaders.has('x-forwarded-proto')).toBe(false)
    expect(requestHeaders.has('x-real-ip')).toBe(false)
    expect(requestHeaders.get('x-request-id')).toBe('request-id')
    expect(fetchMock.mock.calls[0]?.[1]?.redirect).toBe('manual')
  })

  it('confines proxy and menu paths to their intended endpoints', () => {
    expect(isStirDrupalProxyPathSafe('page/about')).toBe(true)
    expect(isStirDrupalProxyPathSafe('../admin')).toBe(false)
    expect(isStirDrupalProxyPathSafe('%2e%2e/admin')).toBe(false)
    expect(isStirDrupalProxyPathSafe('%252e%252e/admin')).toBe(false)
    expect(isStirDrupalProxyPathSafe('page%2Fadmin')).toBe(false)
    expect(isStirDrupalProxyPathSafe('page\\admin')).toBe(false)

    expect(isStirDrupalMenuProxyPathAllowed(
      'api/menu_items/main',
      'api/menu_items/$$$NAME$$$',
    )).toBe(true)
    expect(isStirDrupalMenuProxyPathAllowed(
      'fr/api/menu_items/main',
      'api/menu_items/$$$NAME$$$',
    )).toBe(true)
    expect(isStirDrupalMenuProxyPathAllowed(
      'admin/config',
      'api/menu_items/$$$NAME$$$',
    )).toBe(false)
    expect(isStirDrupalMenuProxyPathAllowed(
      '%2e%2e/admin',
      'api/menu_items/$$$NAME$$$',
    )).toBe(false)
  })

  it('allows only read methods on the menu proxy', async () => {
    await expect(proxyStirDrupalMenuRequest({
      method: 'POST',
    } as never, 'api/menu_items/main')).rejects.toMatchObject({
      statusCode: 405,
    })
  })

  it('preserves query options when proxying menu requests', async () => {
    stubRuntimeConfig()
    const { event } = createEvent(
      '',
      '/api/menu/api/menu_items/main?_format=json&depth=3',
    )

    await proxyStirDrupalMenuRequest(event, 'api/menu_items/main')

    expect(proxyRequest).toHaveBeenCalledWith(
      event,
      'https://menus.example.test/api/menu_items/main?_format=json&depth=3',
      expect.any(Object),
    )
  })

  it('does not forward empty or client-supplied credentials', async () => {
    stubRuntimeConfig({ apiKey: '' })
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}'))

    vi.stubGlobal('fetch', fetchMock)

    const { event } = createEvent('analytics=secret')
    const proxyFetch = createStirDrupalProxyFetch(event)

    await proxyFetch('https://cms.example.test/ce-api/about', {
      headers: {
        cookie: 'protected_access=secret',
        'x-api-key': 'client-supplied-key',
      },
    })

    const requestHeaders = new Headers(fetchMock.mock.calls[0]?.[1]?.headers)

    expect(requestHeaders.has('cookie')).toBe(false)
    expect(requestHeaders.has('x-api-key')).toBe(false)
  })

  it('replaces upstream cookies with standard and configured Drupal sessions', () => {
    stubRuntimeConfig({
      drupalSessionCookieNames: ['custom_drupal_session'],
    })
    const { event, responseHeaders } = createEvent()

    responseHeaders.set('set-cookie', 'tracking=existing')
    replaceStirDrupalSetCookies(event, {
      headers: {
        getSetCookie: () => [
          `${SESSION_NAME}=deleted; Max-Age=0; Path=/; HttpOnly`,
          'custom_drupal_session=value; Path=/; Secure',
          'tracking=value; Path=/',
        ],
      },
    })

    expect(responseHeaders.get('set-cookie')).toEqual([
      `${SESSION_NAME}=deleted; Max-Age=0; Path=/; HttpOnly`,
      'custom_drupal_session=value; Path=/; Secure',
    ])
  })

  it('splits a combined Set-Cookie fallback without losing Expires values', () => {
    stubRuntimeConfig()
    const { event, responseHeaders } = createEvent()

    replaceStirDrupalSetCookies(event, {
      headers: {
        get: () => [
          `${SESSION_NAME}=value; Expires=Wed, 21 Oct 2030 07:28:00 GMT; Path=/`,
          'tracking=value; Path=/',
        ].join(', '),
      },
    })

    expect(responseHeaders.get('set-cookie')).toBe(
      `${SESSION_NAME}=value; Expires=Wed, 21 Oct 2030 07:28:00 GMT; Path=/`,
    )
  })

  it('prevents shared caching when a Drupal session reaches the proxy', () => {
    stubRuntimeConfig()
    const { event, responseHeaders } = createEvent(
      `${SESSION_NAME}=session-value`,
    )

    responseHeaders.set('cache-control', 'public, max-age=300')
    handleStirDrupalProxyResponse(event, new Response('{}'))

    expect(responseHeaders.get('cache-control')).toBe(
      'private, no-store, max-age=0',
    )
  })

  it('never replaces an existing private page boundary with public proxy caching', () => {
    stubRuntimeConfig()
    const { event, responseHeaders } = createEvent()

    responseHeaders.set('cache-control', 'private, no-store, max-age=0')
    handleStirDrupalProxyResponse(event, new Response('{}'))

    expect(responseHeaders.get('cache-control')).toBe(
      'private, no-store, max-age=0',
    )
  })

  it('requires browsers to revalidate anonymous CE responses', () => {
    stubRuntimeConfig()
    const { event, responseHeaders } = createEvent()

    responseHeaders.set('cache-control', 'public, max-age=3600')
    handleStirDrupalProxyResponse(event, new Response('{}'))

    expect(responseHeaders.get('cache-control')).toBe(
      'public, max-age=0, must-revalidate, s-maxage=300',
    )
  })

  it('does not make anonymous write responses publicly cacheable', () => {
    stubRuntimeConfig()
    const { event, responseHeaders } = createEvent()

    Object.assign(event, { method: 'POST' })

    responseHeaders.set('cache-control', 'no-store')
    handleStirDrupalProxyResponse(event, new Response('{}'))

    expect(responseHeaders.get('cache-control')).toBe('no-store')
  })

  it('preserves an upstream private cache boundary for anonymous requests', () => {
    stubRuntimeConfig()
    const { event, responseHeaders } = createEvent()

    responseHeaders.set('cache-control', 'private, max-age=60')
    handleStirDrupalProxyResponse(event, new Response('{}', {
      headers: { 'cache-control': 'private, max-age=60' },
    }))

    expect(responseHeaders.get('cache-control')).toBe(
      'private, no-store, max-age=0',
    )
  })

  it('does not make Drupal error responses publicly cacheable', () => {
    stubRuntimeConfig()
    const { event, responseHeaders } = createEvent()

    responseHeaders.set('cache-control', 'no-cache')
    handleStirDrupalProxyResponse(event, new Response('{}', { status: 404 }))

    expect(responseHeaders.get('cache-control')).toBe('no-cache')
  })

  it('prevents shared caching when Drupal creates a session', () => {
    stubRuntimeConfig()
    const { event, responseHeaders } = createEvent()

    responseHeaders.set('cache-control', 'public, max-age=300')
    handleStirDrupalProxyResponse(event, new Response('{}', {
      headers: {
        'set-cookie': `${SESSION_NAME}=session-value; Path=/; HttpOnly`,
      },
    }))

    expect(responseHeaders.get('cache-control')).toBe(
      'private, no-store, max-age=0',
    )
    expect(responseHeaders.get('set-cookie')).toBe(
      `${SESSION_NAME}=session-value; Path=/; HttpOnly`,
    )
  })
})
