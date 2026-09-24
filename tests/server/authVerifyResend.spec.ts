import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import resendHandler from '../../layers/auth/server/api/auth/verify/resend.post'
import { layerAuthDrupalApiRequest } from '../../layers/auth/server/utils/drupalApi'
import { closeServedHandlers, serveHandler } from './utils/serveHandler'

vi.mock('../../layers/auth/server/utils/drupalApi', () => ({
  layerAuthDrupalApiRequest: vi.fn(),
}))

const post = async (body: unknown, origin?: string) => {
  const url = await serveHandler(resendHandler)

  return fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: origin ?? new URL(url).origin,
    },
    body: JSON.stringify(body),
  })
}

describe('POST /api/auth/verify/resend', () => {
  beforeEach(() => {
    vi.mocked(layerAuthDrupalApiRequest).mockReset()
    vi.stubGlobal('useRuntimeConfig', vi.fn().mockReturnValue({ siteUrl: '' }))
  })

  afterEach(async () => {
    await closeServedHandlers()
    vi.unstubAllGlobals()
  })

  it('forwards the trimmed identifier to Drupal', async () => {
    const accepted = { accepted: true }

    vi.mocked(layerAuthDrupalApiRequest).mockResolvedValue(accepted)

    const response = await post({ identifier: ' demo@example.com ', extra: 1 })

    expect(await response.json()).toEqual(accepted)
    expect(vi.mocked(layerAuthDrupalApiRequest).mock.calls[0]?.slice(1)).toEqual([
      '/api/auth/verify/resend',
      { method: 'POST', body: { identifier: 'demo@example.com' } },
    ])
  })

  it('rejects a missing identifier without calling Drupal', async () => {
    const response = await post({})

    expect(response.status).toBe(400)
    expect(layerAuthDrupalApiRequest).not.toHaveBeenCalled()
  })

  it('blocks cross-origin requests', async () => {
    const response = await post(
      { identifier: 'demo@example.com' },
      'https://malicious.example.test',
    )

    expect(response.status).toBe(403)
    expect(layerAuthDrupalApiRequest).not.toHaveBeenCalled()
  })

  it('passes Drupal rate limiting through', async () => {
    vi.mocked(layerAuthDrupalApiRequest).mockRejectedValue({
      status: 429,
      data: { error: 'Too many requests. Try again later.' },
    })

    const response = await post({ identifier: 'demo@example.com' })

    expect(response.status).toBe(429)
    expect(await response.json()).toMatchObject({
      statusMessage: 'Too many requests. Try again later.',
    })
  })
})
