import { readBody } from 'h3'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import registerHandler from '../../layers/auth/server/api/auth/register.post'
import { layerAuthDrupalApiRequest } from '../../layers/auth/server/utils/drupalApi'

vi.mock('h3', async (importOriginal) => ({
  ...(await importOriginal<typeof import('h3')>()),
  readBody: vi.fn(),
}))

vi.mock('../../layers/auth/server/utils/drupalApi', () => ({
  layerAuthDrupalApiRequest: vi.fn(),
}))

const event = {} as never
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
    vi.mocked(readBody).mockReset()
    vi.mocked(layerAuthDrupalApiRequest).mockReset()
    vi.mocked(layerAuthDrupalApiRequest).mockResolvedValue({ created: true })
    stubAllowedFields([])
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('forwards credentials, the Turnstile token and empty fields by default', async () => {
    vi.mocked(readBody).mockResolvedValue(credentials)

    await expect(registerHandler(event)).resolves.toEqual({ created: true })
    expect(layerAuthDrupalApiRequest).toHaveBeenCalledWith(event, '/api/auth/register', {
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

    vi.mocked(readBody).mockResolvedValue({ ...credentials, fields })

    await registerHandler(event)
    expect(vi.mocked(layerAuthDrupalApiRequest).mock.calls[0]?.[2]).toMatchObject({
      body: { fields },
    })
  })

  it.each(['roles', 'status', 'uid', 'mail', 'pass', 'Field_Name', '__proto__'])(
    'rejects the account or malformed key %s',
    async (key) => {
      vi.mocked(readBody).mockResolvedValue({
        ...credentials,
        fields: JSON.parse(`{"${key}": "administrator"}`),
      })

      await expect(registerHandler(event)).rejects.toMatchObject({ statusCode: 400 })
      expect(layerAuthDrupalApiRequest).not.toHaveBeenCalled()
    },
  )

  it('rejects nested or oversized values', async () => {
    for (const value of [{ target_id: 1 }, [{ target_id: 1 }], 'x'.repeat(2001)]) {
      vi.mocked(readBody).mockResolvedValue({ ...credentials, fields: { bio: value } })

      await expect(registerHandler(event)).rejects.toMatchObject({ statusCode: 400 })
    }

    expect(layerAuthDrupalApiRequest).not.toHaveBeenCalled()
  })

  it('rejects keys outside a configured allow-list', async () => {
    stubAllowedFields(['first_name'])
    vi.mocked(readBody).mockResolvedValue({
      ...credentials,
      fields: { first_name: 'Ada', field_membership: 'gold' },
    })

    await expect(registerHandler(event)).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Registration field "field_membership" is not allowed',
    })
    expect(layerAuthDrupalApiRequest).not.toHaveBeenCalled()
  })
})
