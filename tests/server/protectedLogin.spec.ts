import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import protectedLoginHandler from '../../layers/auth/server/api/auth/protected.post'
import { layerAuthCreateProtectedAccessToken } from '../../layers/auth/server/utils/protectedAccessToken'
import { closeServedHandlers, serveHandler } from './utils/serveHandler'

type PostOptions = {
  cookie?: string
  origin?: string
}

/**
 * Posts a real request, so the handler reads a real body and writes real
 * response headers; the returned set-cookie is whatever the client would get.
 */
const post = async (body: unknown, options: PostOptions = {}) => {
  const url = await serveHandler(protectedLoginHandler)
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    'sec-fetch-site': 'same-origin',
  }

  if (options.cookie) headers.cookie = options.cookie
  if (options.origin) headers.origin = options.origin

  return fetch(url, { method: 'POST', headers, body: JSON.stringify(body) })
}

describe('POST /api/auth/protected', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('useRuntimeConfig', vi.fn().mockReturnValue({
      protectedPassword: 'secret',
      protectedRateLimit: { enabled: false },
    }))
  })

  afterEach(async () => {
    await closeServedHandlers()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('rejects a missing Turnstile token', async () => {
    expect((await post({ password: 'secret' })).status).toBe(422)
  })

  it('rejects a cross-origin request before reading credentials', async () => {
    const response = await post(
      { password: 'secret', turnstile_response: 'valid-token' },
      { origin: 'https://malicious.example.test' },
    )

    expect(response.status).toBe(403)
    expect(await response.json()).toMatchObject({
      statusMessage: 'Cross-origin request blocked',
    })
  })

  it('rejects a failed Turnstile challenge', async () => {
    vi.stubGlobal('verifyTurnstileToken', vi.fn().mockResolvedValue({
      success: false,
    }))

    const response = await post({
      password: 'secret',
      turnstile_response: 'invalid-token',
    })

    expect(response.status).toBe(403)
  })

  it('rejects an invalid password after a successful challenge', async () => {
    vi.stubGlobal('verifyTurnstileToken', vi.fn().mockResolvedValue({
      success: true,
    }))

    const response = await post({
      password: 'incorrect',
      turnstile_response: 'valid-token',
    })

    expect(response.status).toBe(401)
  })

  it('clears a stale access cookie after an invalid password', async () => {
    vi.stubGlobal('verifyTurnstileToken', vi.fn().mockResolvedValue({
      success: true,
    }))

    const response = await post(
      { password: 'incorrect', turnstile_response: 'valid-token' },
      { cookie: 'protected_access=stale-token' },
    )

    expect(response.status).toBe(401)
    expect(response.headers.get('set-cookie')).toEqual(
      expect.stringContaining('Max-Age=0'),
    )
  })

  it('clears a stale access cookie when protected access is not configured', async () => {
    vi.stubGlobal('useRuntimeConfig', vi.fn().mockReturnValue({
      protectedPassword: '',
      protectedRateLimit: { enabled: false },
    }))
    vi.stubGlobal('verifyTurnstileToken', vi.fn().mockResolvedValue({
      success: true,
    }))

    const response = await post(
      { password: 'submitted-password', turnstile_response: 'valid-token' },
      { cookie: 'protected_access=stale-token' },
    )

    expect(response.status).toBe(401)
    expect(response.headers.get('set-cookie')).toEqual(
      expect.stringContaining('Max-Age=0'),
    )
  })

  it('preserves a valid access cookie after an invalid password', async () => {
    vi.stubGlobal('verifyTurnstileToken', vi.fn().mockResolvedValue({
      success: true,
    }))

    const token = await layerAuthCreateProtectedAccessToken('secret', 60)
    const response = await post(
      { password: 'incorrect', turnstile_response: 'valid-token' },
      { cookie: `protected_access=${token}` },
    )

    expect(response.status).toBe(401)
    expect(response.headers.get('set-cookie')).toBeNull()
  })

  it('sets a signed access cookie after a successful challenge', async () => {
    vi.stubGlobal('verifyTurnstileToken', vi.fn().mockResolvedValue({
      success: true,
    }))

    const response = await post({
      password: 'secret',
      turnstile_response: 'valid-token',
    })

    expect(await response.json()).toEqual({ protectedAuthenticated: true })
    expect(response.headers.get('set-cookie')).toEqual(
      expect.stringContaining('protected_access='),
    )
  })

  it('allows logout without a Turnstile challenge', async () => {
    const verify = vi.fn()

    vi.stubGlobal('verifyTurnstileToken', verify)

    const response = await post({ action: 'logout' })

    expect(await response.json()).toEqual({ protectedAuthenticated: false })
    expect(verify).not.toHaveBeenCalled()
    expect(response.headers.get('set-cookie')).toEqual(
      expect.stringContaining('Max-Age=0'),
    )
  })
})
