import { afterEach, describe, expect, it, vi } from 'vitest'
import loginHandler from '../../layers/auth/server/api/auth/login.post'
import { assertStirSameOrigin } from '../../layers/foundation/server/utils/stirRequestSecurity'
import { closeServedHandlers, serveHandler } from './utils/serveHandler'

const post = async (
  origin: string | 'same-origin',
  body: unknown = {},
) => {
  const url = await serveHandler(loginHandler)

  return fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: origin === 'same-origin' ? new URL(url).origin : origin,
    },
    body: JSON.stringify(body),
  })
}

describe('POST /api/auth/login', () => {
  afterEach(async () => {
    await closeServedHandlers()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('blocks cross-origin login attempts before reading credentials', async () => {
    vi.stubGlobal('assertStirSameOrigin', assertStirSameOrigin)
    vi.stubGlobal('useRuntimeConfig', vi.fn().mockReturnValue({
      siteUrl: 'http://127.0.0.1',
    }))

    const response = await post('https://malicious.example.test', {
      identifier: 'editor',
      password: 'secret',
    })

    expect(response.status).toBe(403)
  })

  it('continues validating same-origin login requests', async () => {
    vi.stubGlobal('assertStirSameOrigin', assertStirSameOrigin)
    vi.stubGlobal('useRuntimeConfig', vi.fn().mockReturnValue({ siteUrl: '' }))

    // A same-origin request with an empty body must get past the origin
    // guard and be rejected by validation instead.
    const response = await post('same-origin', {})

    expect(response.status).toBe(400)
  })
})
