import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import verifyHandler from '../../layers/auth/server/api/auth/verify.post'
import { layerAuthDrupalApiRequest } from '../../layers/auth/server/utils/drupalApi'
import { closeServedHandlers, serveHandler } from './utils/serveHandler'

vi.mock('../../layers/auth/server/utils/drupalApi', () => ({
  layerAuthDrupalApiRequest: vi.fn(),
}))

describe('POST /api/auth/verify', () => {
  beforeEach(() => {
    vi.mocked(layerAuthDrupalApiRequest).mockReset()
  })

  afterEach(async () => {
    await closeServedHandlers()
  })

  it('forwards the Drupal session so mismatched accounts are rejected upstream', async () => {
    const payload = {
      uid: 42,
      timestamp: 1_788_288_851,
      token: 'verification-token',
    }
    const response = { verified: true }

    vi.mocked(layerAuthDrupalApiRequest).mockResolvedValue(response)

    const url = await serveHandler(verifyHandler)
    const served = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    })

    expect(await served.json()).toEqual(response)

    const call = vi.mocked(layerAuthDrupalApiRequest).mock.calls[0]

    expect(call?.[1]).toBe('/api/auth/verify')
    expect(call?.[2]).toEqual({
      method: 'POST',
      forwardCookies: true,
      body: payload,
    })
  })
})
