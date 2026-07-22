import { readBody } from 'h3'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import protectedLoginHandler from '../../layers/auth/server/api/auth/protected.post'
import { layerAuthCreateProtectedAccessToken } from '../../layers/auth/server/utils/protectedAccessToken'

vi.mock('h3', async (importOriginal) => ({
  ...(await importOriginal<typeof import('h3')>()),
  readBody: vi.fn(),
}))

const createEvent = () => {
  const headers = new Map<string, string | string[]>()

  return {
    event: {
      node: {
        req: {
          headers: { 'sec-fetch-site': 'same-origin' },
          socket: { remoteAddress: '192.0.2.1' },
        },
        res: {
          getHeader: (name: string) => headers.get(name.toLowerCase()),
          setHeader: (name: string, value: string | string[]) => {
            headers.set(name.toLowerCase(), value)
          },
        },
      },
    } as never,
    headers,
  }
}

describe('POST /api/auth/protected', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('useRuntimeConfig', vi.fn().mockReturnValue({
      protectedPassword: 'secret',
      protectedRateLimit: { enabled: false },
    }))
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('rejects a missing Turnstile token', async () => {
    vi.mocked(readBody).mockResolvedValue({ password: 'secret' })

    await expect(protectedLoginHandler(createEvent().event)).rejects.toMatchObject({
      statusCode: 422,
    })
  })

  it('rejects a cross-origin request before reading credentials', async () => {
    const { event } = createEvent()
    const requestHeaders = (
      event as { node: { req: { headers: Record<string, string> } } }
    ).node.req.headers

    requestHeaders.origin = 'https://malicious.example.test'

    await expect(protectedLoginHandler(event)).rejects.toMatchObject({
      statusCode: 403,
      statusMessage: 'Cross-origin request blocked',
    })
    expect(readBody).not.toHaveBeenCalled()
  })

  it('rejects a failed Turnstile challenge', async () => {
    vi.mocked(readBody).mockResolvedValue({
      password: 'secret',
      turnstile_response: 'invalid-token',
    })
    vi.stubGlobal('verifyTurnstileToken', vi.fn().mockResolvedValue({
      success: false,
    }))

    await expect(protectedLoginHandler(createEvent().event)).rejects.toMatchObject({
      statusCode: 403,
    })
  })

  it('rejects an invalid password after a successful challenge', async () => {
    vi.mocked(readBody).mockResolvedValue({
      password: 'incorrect',
      turnstile_response: 'valid-token',
    })
    vi.stubGlobal('verifyTurnstileToken', vi.fn().mockResolvedValue({
      success: true,
    }))

    await expect(protectedLoginHandler(createEvent().event)).rejects.toMatchObject({
      statusCode: 401,
    })
  })

  it('clears a stale access cookie after an invalid password', async () => {
    vi.mocked(readBody).mockResolvedValue({
      password: 'incorrect',
      turnstile_response: 'valid-token',
    })
    vi.stubGlobal('verifyTurnstileToken', vi.fn().mockResolvedValue({
      success: true,
    }))
    const { event, headers } = createEvent()
    const requestHeaders = (
      event as { node: { req: { headers: Record<string, string> } } }
    ).node.req.headers

    requestHeaders.cookie = 'protected_access=stale-token'

    await expect(protectedLoginHandler(event)).rejects.toMatchObject({
      statusCode: 401,
    })
    expect(headers.get('set-cookie')).toEqual(expect.stringContaining('Max-Age=0'))
  })

  it('preserves a valid access cookie after an invalid password', async () => {
    vi.mocked(readBody).mockResolvedValue({
      password: 'incorrect',
      turnstile_response: 'valid-token',
    })
    vi.stubGlobal('verifyTurnstileToken', vi.fn().mockResolvedValue({
      success: true,
    }))
    const { event, headers } = createEvent()
    const requestHeaders = (
      event as { node: { req: { headers: Record<string, string> } } }
    ).node.req.headers

    requestHeaders.cookie = `protected_access=${await layerAuthCreateProtectedAccessToken('secret', 60)}`

    await expect(protectedLoginHandler(event)).rejects.toMatchObject({
      statusCode: 401,
    })
    expect(headers.get('set-cookie')).toBeUndefined()
  })

  it('sets a signed access cookie after a successful challenge', async () => {
    vi.mocked(readBody).mockResolvedValue({
      password: 'secret',
      turnstile_response: 'valid-token',
    })
    vi.stubGlobal('verifyTurnstileToken', vi.fn().mockResolvedValue({
      success: true,
    }))
    const { event, headers } = createEvent()

    await expect(protectedLoginHandler(event)).resolves.toEqual({
      protectedAuthenticated: true,
    })
    expect(headers.get('set-cookie')).toEqual(expect.stringContaining('protected_access='))
  })

  it('allows logout without a Turnstile challenge', async () => {
    vi.mocked(readBody).mockResolvedValue({ action: 'logout' })
    const verify = vi.fn()

    vi.stubGlobal('verifyTurnstileToken', verify)
    const { event, headers } = createEvent()

    await expect(protectedLoginHandler(event)).resolves.toEqual({
      protectedAuthenticated: false,
    })
    expect(verify).not.toHaveBeenCalled()
    expect(headers.get('set-cookie')).toEqual(expect.stringContaining('Max-Age=0'))
  })
})
