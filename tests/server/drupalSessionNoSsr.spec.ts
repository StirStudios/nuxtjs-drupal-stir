import { afterEach, describe, expect, it, vi } from 'vitest'
import drupalSessionNoSsr from '../../layers/foundation/server/middleware/drupal-session-no-ssr'

const SESSION_NAME = `SSESS${'a'.repeat(32)}`

const createEvent = (cookie: string) => {
  const headers = new Map<string, string | string[]>()

  return {
    event: {
      context: {} as { nuxt?: { noSSR: boolean } },
      method: 'GET',
      path: '/account',
      node: {
        req: {
          headers: { cookie, host: 'example.test' },
          url: '/account',
        },
        res: {
          getHeader: (name: string) => headers.get(name.toLowerCase()),
          setHeader: (name: string, value: string | string[]) => {
            headers.set(name.toLowerCase(), value)
          },
        },
      },
    },
    headers,
  }
}

describe('Drupal session SSR safeguard', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('disables SSR and shared caching for a Drupal session', () => {
    vi.stubEnv('NODE_ENV', 'production')
    const { event, headers } = createEvent(`${SESSION_NAME}=session-value`)

    drupalSessionNoSsr(event as never)

    expect(event.context.nuxt).toEqual({ noSSR: true })
    expect(headers.get('cache-control')).toBe('private, no-store, max-age=0')
  })

  it('keeps SSR enabled locally while preventing shared caching', () => {
    vi.stubEnv('NODE_ENV', 'development')
    const { event, headers } = createEvent(`${SESSION_NAME}=session-value`)

    drupalSessionNoSsr(event as never)

    expect(event.context.nuxt).toBeUndefined()
    expect(headers.get('cache-control')).toBe('private, no-store, max-age=0')
  })

  it('ignores cookie names that only resemble a Drupal session', () => {
    const { event, headers } = createEvent('SSESS=short; SSESS_tracking=value')

    drupalSessionNoSsr(event as never)

    expect(event.context.nuxt).toBeUndefined()
    expect(headers.has('cache-control')).toBe(false)
  })

  it('supports an explicitly configured custom Drupal session name', () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubGlobal('useRuntimeConfig', vi.fn().mockReturnValue({
      drupalSessionCookieNames: ['custom_drupal_session'],
    }))
    const { event, headers } = createEvent(
      'custom_drupal_session=session-value',
    )

    drupalSessionNoSsr(event as never)

    expect(event.context.nuxt).toEqual({ noSSR: true })
    expect(headers.get('cache-control')).toBe('private, no-store, max-age=0')
  })
})
