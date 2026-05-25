import { afterEach, describe, expect, it, vi } from 'vitest'
import protectedSessionHandler from '../../layers/auth/server/api/auth/protected.get'
import { layerAuthCreateProtectedAccessToken } from '../../layers/auth/server/utils/protectedAccessToken'

describe('/api/auth/protected', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns false when no protected access cookie is present', async () => {
    vi.stubGlobal('useRuntimeConfig', vi.fn().mockReturnValue({
      protectedPassword: 'secret',
    }))

    const response = await protectedSessionHandler({
      node: { req: { headers: {} } },
    } as never)

    expect(response).toEqual({ protectedAuthenticated: false })
  })

  it('returns true when the protected access cookie is valid', async () => {
    const secret = 'secret'
    const token = await layerAuthCreateProtectedAccessToken(secret, 60)

    vi.stubGlobal('useRuntimeConfig', vi.fn().mockReturnValue({
      protectedPassword: secret,
    }))

    const response = await protectedSessionHandler({
      node: {
        req: {
          headers: {
            cookie: `protected_access=${token}`,
          },
        },
      },
    } as never)

    expect(response).toEqual({ protectedAuthenticated: true })
  })
})
