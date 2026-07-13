import { describe, expect, it } from 'vitest'
import {
  layerAuthCheckProtectedLoginRateLimit,
  layerAuthGetProtectedRateLimitConfig,
  layerAuthRecordProtectedLoginFailure,
  layerAuthResetProtectedLoginRateLimit,
  type LayerAuthProtectedRateLimitDependencies,
  type LayerAuthProtectedRateLimitStorage,
} from '../../layers/auth/server/utils/protectedRateLimit'

const createMemoryStorage = (): LayerAuthProtectedRateLimitStorage => {
  const values = new Map<string, unknown>()

  return {
    getItem: async <T>(key: string) => (values.get(key) as T | undefined) ?? null,
    setItem: async <T>(key: string, value: T) => {
      values.set(key, value)
    },
    removeItem: async (key: string) => {
      values.delete(key)
    },
  }
}

describe('protected login rate limit', () => {
  const event = { node: { req: { headers: {} } } } as never

  it('does not trust forwarded addresses unless explicitly configured', () => {
    expect(layerAuthGetProtectedRateLimitConfig({
      protectedRateLimit: {},
    } as never).trustProxy).toBe(false)
    expect(layerAuthGetProtectedRateLimitConfig({
      protectedRateLimit: { trustProxy: true },
    } as never).trustProxy).toBe(true)
  })

  it('uses the socket address unless trusted-proxy mode is enabled', async () => {
    const storage = createMemoryStorage()
    const firstEvent = {
      context: {},
      node: {
        req: {
          headers: { 'x-forwarded-for': '198.51.100.10' },
          socket: { remoteAddress: '192.0.2.1' },
        },
      },
    } as never
    const secondEvent = {
      context: {},
      node: {
        req: {
          headers: { 'x-forwarded-for': '198.51.100.10' },
          socket: { remoteAddress: '192.0.2.2' },
        },
      },
    } as never
    const config = {
      enabled: true,
      maxAttempts: 1,
      trustProxy: false,
      windowSeconds: 60,
    }

    await layerAuthRecordProtectedLoginFailure(firstEvent, { config, storage })

    await expect(layerAuthCheckProtectedLoginRateLimit(secondEvent, {
      config,
      storage,
    })).resolves.toEqual({ allowed: true, retryAfterSeconds: 0 })

    const trustedProxyConfig = { ...config, trustProxy: true }

    await layerAuthRecordProtectedLoginFailure(firstEvent, {
      config: trustedProxyConfig,
      storage,
    })

    await expect(layerAuthCheckProtectedLoginRateLimit(secondEvent, {
      config: trustedProxyConfig,
      storage,
    })).resolves.toEqual({ allowed: false, retryAfterSeconds: 60 })
  })

  it('blocks an identifier after the configured number of failures', async () => {
    const storage = createMemoryStorage()
    const dependencies: LayerAuthProtectedRateLimitDependencies = {
      config: {
        enabled: true,
        maxAttempts: 2,
        trustProxy: false,
        windowSeconds: 60,
      },
      identifier: '192.0.2.10',
      now: () => 1_000,
      storage,
    }

    await layerAuthRecordProtectedLoginFailure(event, dependencies)
    await expect(layerAuthCheckProtectedLoginRateLimit(event, dependencies))
      .resolves.toEqual({ allowed: true, retryAfterSeconds: 0 })

    await layerAuthRecordProtectedLoginFailure(event, dependencies)
    await expect(layerAuthCheckProtectedLoginRateLimit(event, dependencies))
      .resolves.toEqual({ allowed: false, retryAfterSeconds: 60 })
  })

  it('clears failures after a successful login', async () => {
    const storage = createMemoryStorage()
    const dependencies: LayerAuthProtectedRateLimitDependencies = {
      config: {
        enabled: true,
        maxAttempts: 1,
        trustProxy: false,
        windowSeconds: 60,
      },
      identifier: '192.0.2.11',
      now: () => 1_000,
      storage,
    }

    await layerAuthRecordProtectedLoginFailure(event, dependencies)
    await layerAuthResetProtectedLoginRateLimit(event, dependencies)

    await expect(layerAuthCheckProtectedLoginRateLimit(event, dependencies))
      .resolves.toEqual({ allowed: true, retryAfterSeconds: 0 })
  })

  it('fails open when rate-limit storage is unavailable', async () => {
    const storage: LayerAuthProtectedRateLimitStorage = {
      getItem: async () => { throw new Error('unavailable') },
      setItem: async () => { throw new Error('unavailable') },
      removeItem: async () => { throw new Error('unavailable') },
    }

    await expect(layerAuthCheckProtectedLoginRateLimit(event, {
      config: {
        enabled: true,
        maxAttempts: 1,
        trustProxy: false,
        windowSeconds: 60,
      },
      identifier: '192.0.2.12',
      storage,
    })).resolves.toEqual({ allowed: true, retryAfterSeconds: 0 })
  })
})
