import { describe, expect, it } from 'vitest'
import authCacheControl from '../../layers/auth/server/middleware/auth-cache-control'

const createEvent = (url: string) => {
  const headers = new Map<string, string | string[]>()

  return {
    event: {
      node: {
        req: { headers: { host: 'example.test' }, originalUrl: url, url },
        res: {
          getHeader: (name: string) => headers.get(name.toLowerCase()),
          setHeader: (name: string, value: string | string[]) => {
            headers.set(name.toLowerCase(), value)
          },
        },
      },
    } as never,
    headers,
  }
}

describe('auth API cache control', () => {
  it('marks every auth and account API response private and non-cacheable', () => {
    for (const path of [
      '/api/auth/session',
      '/api/auth/login',
      '/api/auth/password/reset',
      '/api/account/settings/values',
    ]) {
      const { event, headers } = createEvent(path)

      authCacheControl(event)

      expect(headers.get('cache-control')).toBe('private, no-store, max-age=0')
    }
  })

  it('does not change unrelated API responses', () => {
    const { event, headers } = createEvent('/api/health')

    authCacheControl(event)

    expect(headers.has('cache-control')).toBe(false)
  })
})
