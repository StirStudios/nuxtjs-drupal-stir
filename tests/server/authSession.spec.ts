import { describe, expect, it, vi, afterEach } from 'vitest'
import sessionHandler from '../../server/api/auth/session.get'

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
