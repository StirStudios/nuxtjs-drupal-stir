import { beforeEach, describe, expect, it, vi } from 'vitest'
import { layerAuthDrupalApiRequest } from '../../layers/auth/server/utils/drupalApi'
import protectedContentMiddleware from '../../layers/auth/server/middleware/protected-content'
import { layerAuthCreateProtectedAccessToken } from '../../layers/auth/server/utils/protectedAccessToken'
import { handleStirDrupalProxyResponse } from '../../layers/core/server/utils/drupalCeProxy'

vi.mock('../../layers/auth/server/utils/drupalApi', () => ({
  layerAuthDrupalApiRequest: vi.fn(),
}))

const SECRET = 'protected-password'
const SESSION_COOKIE = `SSESS${'a'.repeat(32)}`

const stubRuntimeConfig = (
  requireLoginPaths: string[],
  overrides: Record<string, unknown> = {},
) => {
  vi.stubGlobal('useRuntimeConfig', vi.fn().mockReturnValue({
    protectedPassword: SECRET,
    stirProtectedRoutes: {
      requireLoginPaths,
      allowAuthenticatedUserBypass: false,
      ...overrides,
    },
    drupalSessionCookieNames: [],
    public: {},
  }))
}

const createEvent = (path: string, cookie = '') => ({
  context: {},
  method: 'GET',
  path,
  node: {
    req: { headers: cookie ? { cookie } : {}, method: 'GET', url: path },
    res: { setHeader: vi.fn(), getHeader: vi.fn(), removeHeader: vi.fn() },
  },
} as never)

describe('protected content boundary', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
    vi.mocked(layerAuthDrupalApiRequest).mockReset()
  })

  it('rejects the page payload behind a protected route', async () => {
    stubRuntimeConfig(['/private/'])

    await expect(
      protectedContentMiddleware(createEvent('/api/drupal-ce/private/report')),
    ).rejects.toMatchObject({ statusCode: 403 })
  })

  it('allows the payload when a valid protected-access cookie is present', async () => {
    stubRuntimeConfig(['/private/'])

    const token = await layerAuthCreateProtectedAccessToken(SECRET, 3600)

    await expect(
      protectedContentMiddleware(
        createEvent('/api/drupal-ce/private/report', `protected_access=${token}`),
      ),
    ).resolves.toBeUndefined()
  })

  // Drupal may mark CE responses public; the proxy copies that header over the
  // private marker set here, which must still win.
  it('keeps an authorized protected payload private when Drupal sends public', async () => {
    stubRuntimeConfig(['/private/'])
    const token = await layerAuthCreateProtectedAccessToken(SECRET, 3600)
    const headers = new Map<string, string | string[]>()
    const event = {
      context: {},
      method: 'GET',
      path: '/api/drupal-ce/private/report',
      node: {
        req: {
          headers: { cookie: `protected_access=${token}` },
          method: 'GET',
          url: '/api/drupal-ce/private/report',
        },
        res: {
          getHeader: (name: string) => headers.get(name.toLowerCase()),
          removeHeader: (name: string) => headers.delete(name.toLowerCase()),
          setHeader: (name: string, value: string | string[]) => {
            headers.set(name.toLowerCase(), value)
          },
        },
      },
    } as never

    await protectedContentMiddleware(event)
    headers.set('cache-control', 'max-age=3600, public')
    handleStirDrupalProxyResponse(event, new Response('{}', {
      headers: { 'cache-control': 'max-age=3600, public' },
    }))

    expect(headers.get('cache-control')).toBe('private, no-store, max-age=0')
  })

  it('rejects a protected-access cookie signed with a different secret', async () => {
    stubRuntimeConfig(['/private/'])

    const token = await layerAuthCreateProtectedAccessToken('other-secret', 3600)

    await expect(
      protectedContentMiddleware(
        createEvent('/api/drupal-ce/private/report', `protected_access=${token}`),
      ),
    ).rejects.toMatchObject({ statusCode: 403 })
  })

  it('rejects an expired protected-access cookie', async () => {
    stubRuntimeConfig(['/private/'])

    const token = await layerAuthCreateProtectedAccessToken(SECRET, -10)

    await expect(
      protectedContentMiddleware(
        createEvent('/api/drupal-ce/private/report', `protected_access=${token}`),
      ),
    ).rejects.toMatchObject({ statusCode: 403 })
  })

  it('leaves unprotected page payloads untouched', async () => {
    stubRuntimeConfig(['/private/'])

    await expect(
      protectedContentMiddleware(createEvent('/api/drupal-ce/about')),
    ).resolves.toBeUndefined()
  })

  it('ignores requests that are not page proxy reads', async () => {
    stubRuntimeConfig(['/private/'])

    await expect(
      protectedContentMiddleware(createEvent('/api/menu/main')),
    ).resolves.toBeUndefined()
  })

  it('does nothing when no protected routes are configured', async () => {
    stubRuntimeConfig([])

    await expect(
      protectedContentMiddleware(createEvent('/api/drupal-ce/private/report')),
    ).resolves.toBeUndefined()
  })

  it('lets a Drupal session through when the bypass is enabled and Drupal confirms it', async () => {
    stubRuntimeConfig(['/private/'], { allowAuthenticatedUserBypass: true })
    vi.mocked(layerAuthDrupalApiRequest).mockResolvedValue({ authenticated: true })

    await expect(
      protectedContentMiddleware(
        createEvent('/api/drupal-ce/private/report', `${SESSION_COOKIE}=value`),
      ),
    ).resolves.toBeUndefined()
  })

  it('ignores a Drupal session when the bypass is disabled', async () => {
    stubRuntimeConfig(['/private/'])

    await expect(
      protectedContentMiddleware(
        createEvent('/api/drupal-ce/private/report', `${SESSION_COOKIE}=value`),
      ),
    ).rejects.toMatchObject({ statusCode: 403 })

    expect(layerAuthDrupalApiRequest).not.toHaveBeenCalled()
  })

  it('rejects a forged session cookie that Drupal does not authenticate', async () => {
    stubRuntimeConfig(['/private/'], { allowAuthenticatedUserBypass: true })
    vi.mocked(layerAuthDrupalApiRequest).mockResolvedValue({ authenticated: false })

    await expect(
      protectedContentMiddleware(
        createEvent('/api/drupal-ce/private/report', `${SESSION_COOKIE}=forged`),
      ),
    ).rejects.toMatchObject({ statusCode: 403 })
  })

  it('rejects the bypass when the Drupal session check fails', async () => {
    stubRuntimeConfig(['/private/'], { allowAuthenticatedUserBypass: true })
    vi.mocked(layerAuthDrupalApiRequest).mockRejectedValue(new Error('unreachable'))

    await expect(
      protectedContentMiddleware(
        createEvent('/api/drupal-ce/private/report', `${SESSION_COOKIE}=value`),
      ),
    ).rejects.toMatchObject({ statusCode: 403 })
  })

  it('does not evade the prefix match via a doubled leading slash', async () => {
    stubRuntimeConfig(['/private/'])

    await expect(
      protectedContentMiddleware(createEvent('/api/drupal-ce//private/report')),
    ).rejects.toMatchObject({ statusCode: 403 })
  })
})
