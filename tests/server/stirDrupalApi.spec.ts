import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  appendStirDrupalSetCookies,
  filterStirDrupalSessionCookies,
  getStirDrupalApiConfig,
  stirDrupalApiRequest,
  throwStirDrupalApiError,
} from '../../layers/foundation/server/utils/stirDrupalApi'

const SESSION_NAME = `SSESS${'a'.repeat(32)}`

const createEvent = (cookie = '') => {
  const headers = new Map<string, string | string[]>()

  return {
    event: {
      context: {},
      node: {
        req: {
          headers: {
            'sec-fetch-site': 'same-origin',
            ...(cookie ? { cookie } : {}),
          },
        },
        res: {
          getHeader: (name: string) => headers.get(name.toLowerCase()),
          removeHeader: (name: string) => headers.delete(name.toLowerCase()),
          setHeader: (name: string, value: string | string[]) => {
            headers.set(name.toLowerCase(), value)
          },
        },
      },
    } as never,
    headers,
  }
}

describe('Stir Drupal API boundary', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('prefers the server Drupal URL and normalizes the timeout', () => {
    vi.stubGlobal('useRuntimeConfig', vi.fn().mockReturnValue({
      api: 'https://private.example.test',
      apiKey: 'api-key',
      drupalRequestTimeoutMs: 2500,
      public: {
        api: 'https://public.example.test',
        drupalCe: {
          drupalBaseUrl: 'https://browser.example.test',
          serverDrupalBaseUrl: 'http://drupal.internal/',
        },
      },
    }))

    expect(getStirDrupalApiConfig()).toEqual({
      apiKey: 'api-key',
      baseUrl: 'http://drupal.internal',
      requestTimeoutMs: 2500,
    })
  })

  it('forwards only strictly named Drupal session cookies', () => {
    expect(filterStirDrupalSessionCookies([
      'analytics=private',
      `${SESSION_NAME}=session-value`,
      'SSESS=too-short',
      `not_${SESSION_NAME}=wrong-prefix`,
    ].join('; '))).toBe(`${SESSION_NAME}=session-value`)
  })

  it('supports explicitly configured custom Drupal session cookie names', () => {
    expect(filterStirDrupalSessionCookies(
      'analytics=private; custom_drupal_session=session-value',
      ['custom_drupal_session'],
    )).toBe('custom_drupal_session=session-value')
  })

  it('uses the filtered session cookie, timeout, and private cache policy', async () => {
    vi.stubGlobal('useRuntimeConfig', vi.fn().mockReturnValue({
      apiKey: 'api-key',
      drupalRequestTimeoutMs: 3500,
      public: { api: 'https://cms.example.test' },
    }))
    const raw = vi.fn().mockResolvedValue({
      _data: { authenticated: true },
      headers: { getSetCookie: () => [] },
    })

    vi.stubGlobal('$fetch', { raw })

    const { event, headers } = createEvent(
      `analytics=secret; ${SESSION_NAME}=session-value`,
    )

    await expect(stirDrupalApiRequest(event, '/api/auth/session', {
      method: 'GET',
      forwardCookies: true,
    })).resolves.toEqual({ authenticated: true })

    expect(raw).toHaveBeenCalledWith(
      'https://cms.example.test/api/auth/session',
      expect.objectContaining({
        headers: {
          cookie: `${SESSION_NAME}=session-value`,
          'x-api-key': 'api-key',
        },
        redirect: 'manual',
        timeout: 3500,
      }),
    )
    expect(headers.get('cache-control')).toBe('private, no-store, max-age=0')
  })

  it('adds a Drupal CSRF token to cookie-authenticated mutations', async () => {
    vi.stubGlobal('useRuntimeConfig', vi.fn().mockReturnValue({
      apiKey: 'api-key',
      public: { api: 'https://cms.example.test' },
    }))
    const raw = vi.fn()
      .mockResolvedValueOnce({
        _data: 'rest-csrf-token',
        headers: { getSetCookie: () => [] },
        status: 200,
      })
      .mockResolvedValueOnce({
        _data: { updated: true },
        headers: { getSetCookie: () => [] },
        status: 200,
      })

    vi.stubGlobal('$fetch', { raw })
    const { event } = createEvent(`${SESSION_NAME}=session-value`)

    await stirDrupalApiRequest(event, '/api/account/settings/values', {
      method: 'PATCH',
      forwardCookies: true,
      body: { values: { name: 'Updated' } },
    })

    expect(raw).toHaveBeenNthCalledWith(
      1,
      'https://cms.example.test/session/token',
      expect.objectContaining({
        headers: {
          cookie: `${SESSION_NAME}=session-value`,
          'x-api-key': 'api-key',
        },
        redirect: 'manual',
      }),
    )
    expect(raw).toHaveBeenNthCalledWith(
      2,
      'https://cms.example.test/api/account/settings/values',
      expect.objectContaining({
        headers: {
          cookie: `${SESSION_NAME}=session-value`,
          'x-api-key': 'api-key',
          'x-csrf-token': 'rest-csrf-token',
        },
        method: 'PATCH',
        redirect: 'manual',
      }),
    )
  })

  it('blocks cross-origin mutations before contacting Drupal', async () => {
    vi.stubGlobal('useRuntimeConfig', vi.fn().mockReturnValue({
      apiKey: 'api-key',
      siteUrl: 'https://www.example.test',
      public: { api: 'https://cms.example.test' },
    }))
    const raw = vi.fn()

    vi.stubGlobal('$fetch', { raw })
    const { event } = createEvent()
    const requestHeaders = (
      event as { node: { req: { headers: Record<string, string> } } }
    ).node.req.headers

    requestHeaders.origin = 'https://malicious.example.test'

    await expect(stirDrupalApiRequest(event, '/api/account/settings/values', {
      method: 'PATCH',
      body: { values: { name: 'Updated' } },
    })).rejects.toMatchObject({
      statusCode: 403,
      statusMessage: 'Cross-origin request blocked',
    })
    expect(raw).not.toHaveBeenCalled()
  })

  it('marks anonymous mutations private and no-store', async () => {
    vi.stubGlobal('useRuntimeConfig', vi.fn().mockReturnValue({
      apiKey: 'api-key',
      public: { api: 'https://cms.example.test' },
    }))
    vi.stubGlobal('$fetch', {
      raw: vi.fn().mockResolvedValue({
        _data: { subscribed: true },
        headers: { getSetCookie: () => [] },
        status: 200,
      }),
    })
    const { event, headers } = createEvent()

    await stirDrupalApiRequest(event, '/api/newsletter/subscribe', {
      method: 'POST',
      body: { email: 'person@example.test' },
    })

    expect(headers.get('cache-control')).toBe('private, no-store, max-age=0')
  })

  it('supports an explicit same-origin opt-out for trusted server integrations', async () => {
    vi.stubGlobal('useRuntimeConfig', vi.fn().mockReturnValue({
      apiKey: 'api-key',
      public: { api: 'https://cms.example.test' },
    }))
    const raw = vi.fn().mockResolvedValue({
      _data: { accepted: true },
      headers: { getSetCookie: () => [] },
      status: 200,
    })

    vi.stubGlobal('$fetch', { raw })
    const { event } = createEvent()
    const requestHeaders = (
      event as { node: { req: { headers: Record<string, string> } } }
    ).node.req.headers

    delete requestHeaders['sec-fetch-site']

    await expect(stirDrupalApiRequest(event, '/api/integration/callback', {
      method: 'POST',
      enforceSameOrigin: false,
    })).resolves.toEqual({ accepted: true })
    expect(raw).toHaveBeenCalledOnce()
  })

  it('rejects upstream redirects instead of returning a false success', async () => {
    vi.stubGlobal('useRuntimeConfig', vi.fn().mockReturnValue({
      apiKey: 'api-key',
      public: { api: 'https://cms.example.test' },
    }))
    vi.stubGlobal('$fetch', {
      raw: vi.fn().mockResolvedValue({
        _data: undefined,
        headers: { getSetCookie: () => [] },
        status: 302,
      }),
    })

    const { event } = createEvent()

    await expect(stirDrupalApiRequest(event, '/api/auth/login'))
      .rejects.toMatchObject({
        statusCode: 502,
        statusMessage: 'Drupal upstream redirect was rejected',
      })
  })

  it('forwards only Drupal session Set-Cookie headers', () => {
    const { event, headers } = createEvent()

    appendStirDrupalSetCookies(event, {
      headers: {
        getSetCookie: () => [
          `${SESSION_NAME}=session-value; Path=/; HttpOnly`,
          'tracking=value; Path=/',
        ],
      },
    })

    expect(headers.get('set-cookie')).toBe(
      `${SESSION_NAME}=session-value; Path=/; HttpOnly`,
    )
  })

  it('forwards a normalized trusted client IP for Drupal auth limits', async () => {
    vi.stubGlobal('useRuntimeConfig', vi.fn().mockReturnValue({
      apiKey: 'api-key',
      drupalClientIpForwarding: {
        enabled: true,
        trustProxy: true,
      },
      public: { api: 'https://cms.example.test' },
    }))
    const raw = vi.fn().mockResolvedValue({
      _data: { authenticated: true },
      headers: { getSetCookie: () => [] },
    })

    vi.stubGlobal('$fetch', { raw })

    const { event } = createEvent()
    const requestHeaders = (
      event as { node: { req: { headers: Record<string, string> } } }
    ).node.req.headers

    requestHeaders['x-forwarded-for'] = '203.0.113.10'

    await stirDrupalApiRequest(event, '/api/auth/login', {
      forwardClientIp: true,
    })

    expect(raw).toHaveBeenCalledWith(
      'https://cms.example.test/api/auth/login',
      expect.objectContaining({
        headers: {
          'x-api-key': 'api-key',
          'x-forwarded-for': '203.0.113.10',
        },
        redirect: 'manual',
      }),
    )
  })

  it('does not expose upstream server errors or messages', () => {
    expect(() => throwStirDrupalApiError({
      statusCode: 500,
      data: { message: 'Database password leaked' },
    }, 'Registration failed')).toThrow(expect.objectContaining({
      statusCode: 502,
      statusMessage: 'Registration failed',
    }))
  })

  it('preserves stir_account user-facing 4xx contract errors', () => {
    expect(() => throwStirDrupalApiError({
      status: 422,
      data: {
        error: 'Password does not meet the configured policy.',
        errors: {
          password: 'Use at least 12 characters.',
        },
      },
    }, 'Registration failed')).toThrow(expect.objectContaining({
      statusCode: 422,
      statusMessage:
        'Password does not meet the configured policy. password: Use at least 12 characters.',
    }))
  })

  it('reports upstream failures through the Nitro error hook', async () => {
    vi.stubGlobal('useRuntimeConfig', vi.fn().mockReturnValue({
      apiKey: 'api-key',
      public: { api: 'https://cms.example.test' },
    }))
    const upstreamError = new Error('Drupal unavailable')
    const captureError = vi.fn()

    vi.stubGlobal('$fetch', {
      raw: vi.fn().mockRejectedValue(upstreamError),
    })
    vi.stubGlobal('useNitroApp', vi.fn().mockReturnValue({ captureError }))

    const { event } = createEvent()

    await expect(stirDrupalApiRequest(event, '/api/auth/session'))
      .rejects.toBe(upstreamError)
    expect(captureError).toHaveBeenCalledWith(upstreamError, {
      event,
      tags: ['stir-drupal-api'],
    })
  })
})
