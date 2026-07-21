import { afterEach, describe, expect, it, vi } from 'vitest'
import protectedSessionHandler from '../../layers/auth/server/api/auth/protected.get'
import { layerAuthGetProtectedAccessSecret } from '../../layers/auth/server/utils/protectedAccess'
import { layerAuthCreateProtectedAccessToken } from '../../layers/auth/server/utils/protectedAccessToken'

describe('/api/auth/protected', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
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

    vi.stubGlobal('useRuntimeConfig', vi.fn().mockReturnValue({
      protectedPassword: secret,
    }))
    const token = await layerAuthCreateProtectedAccessToken(
      layerAuthGetProtectedAccessSecret(),
      60,
    )

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

  it('invalidates protected access when the password rotates', async () => {
    const runtimeConfig = {
      protectedPassword: 'old-password',
    }

    vi.stubGlobal('useRuntimeConfig', vi.fn(() => runtimeConfig))
    const token = await layerAuthCreateProtectedAccessToken(
      layerAuthGetProtectedAccessSecret(),
      60,
    )

    runtimeConfig.protectedPassword = 'new-password'

    const response = await protectedSessionHandler({
      node: {
        req: {
          headers: {
            cookie: `protected_access=${token}`,
          },
        },
      },
    } as never)

    expect(response).toEqual({ protectedAuthenticated: false })
  })
})
