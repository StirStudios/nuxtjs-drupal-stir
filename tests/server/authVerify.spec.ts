import { readBody } from 'h3'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import verifyHandler from '../../layers/auth/server/api/auth/verify.post'
import { layerAuthDrupalApiRequest } from '../../layers/auth/server/utils/drupalApi'

vi.mock('h3', async (importOriginal) => ({
  ...(await importOriginal<typeof import('h3')>()),
  readBody: vi.fn(),
}))

vi.mock('../../layers/auth/server/utils/drupalApi', () => ({
  layerAuthDrupalApiRequest: vi.fn(),
  layerAuthThrowDrupalApiError: vi.fn(),
}))

describe('POST /api/auth/verify', () => {
  beforeEach(() => {
    vi.mocked(readBody).mockReset()
    vi.mocked(layerAuthDrupalApiRequest).mockReset()
  })

  it('forwards the Drupal session so mismatched accounts are rejected upstream', async () => {
    const event = {} as never
    const payload = {
      uid: 42,
      timestamp: 1_788_288_851,
      token: 'verification-token',
    }
    const response = { verified: true }

    vi.mocked(readBody).mockResolvedValue(payload)
    vi.mocked(layerAuthDrupalApiRequest).mockResolvedValue(response)

    await expect(verifyHandler(event)).resolves.toEqual(response)
    expect(layerAuthDrupalApiRequest).toHaveBeenCalledWith(
      event,
      '/api/auth/verify',
      {
        method: 'POST',
        forwardCookies: true,
        body: payload,
      },
    )
  })
})
