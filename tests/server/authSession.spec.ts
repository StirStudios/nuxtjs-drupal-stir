import { describe, expect, it, vi, afterEach } from 'vitest'
import sessionHandler from '../../layers/auth/server/api/auth/session.get'
import authenticatedSession from '../../contracts/stir-tools/v1/fixtures/auth-session-authenticated.json'

describe('/api/auth/session', () => {
  const mockEvent = {
    node: {
      req: {
        headers: {},
      },
    },
  } as never

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('maps authenticated Drupal session response', async () => {
    vi.stubGlobal('useRuntimeConfig', vi.fn().mockReturnValue({
      apiKey: 'api-key',
      public: { api: 'https://cms.example.test' },
    }))
    vi.stubGlobal('$fetch', {
      raw: vi.fn().mockResolvedValue({
        _data: {
          authenticated: true,
          uid: 10,
          name: 'Demo',
          mail: 'demo@example.test',
          roles: ['authenticated'],
        },
      }),
    })

    const response = await sessionHandler(mockEvent)

    expect(response).toEqual({
      authenticated: true,
      protectedAuthenticated: false,
      user: {
        uid: 10,
        name: 'Demo',
        mail: 'demo@example.test',
        roles: ['authenticated'],
      },
    })
  })

  it('keeps Drupal CSRF and logout tokens out of the client session', async () => {
    vi.stubGlobal('useRuntimeConfig', vi.fn().mockReturnValue({
      apiKey: 'api-key',
      public: { api: 'https://cms.example.test' },
    }))
    vi.stubGlobal('$fetch', {
      raw: vi.fn().mockResolvedValue({ _data: authenticatedSession }),
    })

    const response = await sessionHandler(mockEvent) as { user: Record<string, unknown> }

    expect(response.user).not.toHaveProperty('csrf_token')
    expect(response.user).not.toHaveProperty('logout_token')
    expect(response.user).toMatchObject({
      uid: authenticatedSession.uid,
      account_name: authenticatedSession.account_name,
      capabilities: authenticatedSession.capabilities,
      profile_complete: true,
    })
  })

  it('returns unauthenticated payload when Drupal base URL is missing', async () => {
    vi.stubGlobal('useRuntimeConfig', vi.fn().mockReturnValue({
      apiKey: '',
      public: { api: '' },
    }))

    const response = await sessionHandler(mockEvent)

    expect(response).toEqual({
      authenticated: false,
      protectedAuthenticated: false,
      user: null,
    })
  })
})
