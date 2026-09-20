import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import registerHandler from '../../layers/auth/server/api/auth/register.post'
import { layerAuthDrupalApiRequest } from '../../layers/auth/server/utils/drupalApi'
import { closeServedHandlers, serveHandler } from './utils/serveHandler'

vi.mock('../../layers/auth/server/utils/drupalApi', () => ({
  layerAuthDrupalApiRequest: vi.fn(),
}))

/**
 * Posts a real request, so the handler parses a real body.
 */
const post = async (body: unknown) => {
  const url = await serveHandler(registerHandler)

  return fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const forwardedBody = () =>
  (vi.mocked(layerAuthDrupalApiRequest).mock.calls[0]?.[2] ?? {}) as {
    body?: Record<string, unknown>
  }

const credentials = {
  email: 'demo@example.com',
  password: 'secret',
  turnstile_response: 'token',
}

const stubAllowedFields = (allowedFields: string[]) => {
  vi.stubGlobal('useRuntimeConfig', vi.fn().mockReturnValue({
    stirAuthRegister: { allowedFields },
  }))
}

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    vi.mocked(layerAuthDrupalApiRequest).mockReset()
    vi.mocked(layerAuthDrupalApiRequest).mockResolvedValue({ created: true })
    stubAllowedFields([])
  })

  afterEach(async () => {
    await closeServedHandlers()
    vi.unstubAllGlobals()
  })

  it('forwards credentials, the Turnstile token and empty fields by default', async () => {
    const response = await post(credentials)

    expect(await response.json()).toEqual({ created: true })
    expect(vi.mocked(layerAuthDrupalApiRequest).mock.calls[0]?.[1]).toBe('/api/auth/register')
    expect(forwardedBody()).toEqual({
      method: 'POST',
      body: { ...credentials, display_name: '', fields: {} },
    })
  })

  it('forwards well-formed project fields', async () => {
    const fields = {
      first_name: 'Ada',
      user_type: 12,
      newsletter: true,
      styles: ['hip_hop', 'jazz'],
      nickname: null,
    }

    await post({ ...credentials, fields })

    expect(forwardedBody()).toMatchObject({ body: { fields } })
  })

  it.each(['roles', 'status', 'uid', 'mail', 'pass', 'Field_Name', '__proto__'])(
    'rejects the account or malformed key %s',
    async (key) => {
      const response = await post({
        ...credentials,
        fields: JSON.parse(`{"${key}": "administrator"}`),
      })

      expect(response.status).toBe(400)
      expect(layerAuthDrupalApiRequest).not.toHaveBeenCalled()
    },
  )

  it('rejects nested or oversized values', async () => {
    for (const value of [{ target_id: 1 }, [{ target_id: 1 }], 'x'.repeat(2001)]) {
      const response = await post({ ...credentials, fields: { bio: value } })

      expect(response.status).toBe(400)
    }

    expect(layerAuthDrupalApiRequest).not.toHaveBeenCalled()
  })

  it('rejects keys outside a configured allow-list', async () => {
    stubAllowedFields(['first_name'])
    const response = await post({
      ...credentials,
      fields: { first_name: 'Ada', field_membership: 'gold' },
    })

    expect(response.status).toBe(400)
    expect(await response.json()).toMatchObject({
      statusMessage: 'Registration field "field_membership" is not allowed',
    })
    expect(layerAuthDrupalApiRequest).not.toHaveBeenCalled()
  })
})
