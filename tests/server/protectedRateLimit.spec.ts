import { afterEach, describe, expect, it, vi } from 'vitest'
import { RateLimiterMemory } from 'rate-limiter-flexible'
import {
  layerAuthConsumeProtectedLoginAttempt,
  layerAuthGetProtectedRateLimitConfig,
  layerAuthResetProtectedLoginRateLimit,
  type LayerAuthProtectedRateLimitDependencies,
} from '../../layers/auth/server/utils/protectedRateLimit'

describe('protected login rate limit', () => {
  const event = { context: {}, node: { req: { headers: {} } } } as never

  afterEach(() => vi.useRealTimers())

  it('does not trust forwarded addresses unless explicitly configured', () => {
    expect(layerAuthGetProtectedRateLimitConfig({
      protectedRateLimit: {},
    } as never).trustProxy).toBe(false)
    expect(layerAuthGetProtectedRateLimitConfig({
      protectedRateLimit: { trustProxy: true },
    } as never).trustProxy).toBe(true)
  })

  it('uses the socket address unless trusted-proxy mode is enabled', async () => {
    const limiter = new RateLimiterMemory({ points: 1, duration: 60 })
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

    await layerAuthConsumeProtectedLoginAttempt(firstEvent, { config, limiter })

    await expect(layerAuthConsumeProtectedLoginAttempt(secondEvent, {
      config,
      limiter,
    })).resolves.toEqual({ allowed: true, retryAfterSeconds: 0 })

    const trustedProxyConfig = { ...config, trustProxy: true }

    await layerAuthConsumeProtectedLoginAttempt(firstEvent, {
      config: trustedProxyConfig,
      limiter,
    })

    await expect(layerAuthConsumeProtectedLoginAttempt(secondEvent, {
      config: trustedProxyConfig,
      limiter,
    })).resolves.toEqual({ allowed: false, retryAfterSeconds: 60 })
  })

  it('reserves attempts atomically before overlapping validations run', async () => {
    const dependencies: LayerAuthProtectedRateLimitDependencies = {
      config: { enabled: true, maxAttempts: 5, trustProxy: false, windowSeconds: 60 },
      identifier: '192.0.2.10',
      limiter: new RateLimiterMemory({ points: 5, duration: 60 }),
    }
    const results = await Promise.all(Array.from({ length: 20 }, () =>
      layerAuthConsumeProtectedLoginAttempt(event, dependencies)))

    expect(results.filter(result => result.allowed)).toHaveLength(5)
    expect(results.filter(result => !result.allowed)).toHaveLength(15)
    expect(results.filter(result => !result.allowed).every(result => result.retryAfterSeconds === 60)).toBe(true)
  })

  it('allows another attempt after the window expires', async () => {
    vi.useFakeTimers()
    const dependencies: LayerAuthProtectedRateLimitDependencies = {
      config: { enabled: true, maxAttempts: 1, trustProxy: false, windowSeconds: 60 },
      identifier: '192.0.2.20',
      limiter: new RateLimiterMemory({ points: 1, duration: 60 }),
    }

    await layerAuthConsumeProtectedLoginAttempt(event, dependencies)
    expect((await layerAuthConsumeProtectedLoginAttempt(event, dependencies)).allowed).toBe(false)
    await vi.advanceTimersByTimeAsync(60_001)
    expect((await layerAuthConsumeProtectedLoginAttempt(event, dependencies)).allowed).toBe(true)
  })

  it('clears failures after a successful login', async () => {
    const limiter = new RateLimiterMemory({ points: 1, duration: 60 })
    const dependencies: LayerAuthProtectedRateLimitDependencies = {
      config: {
        enabled: true,
        maxAttempts: 1,
        trustProxy: false,
        windowSeconds: 60,
      },
      identifier: '192.0.2.11',
      limiter,
    }

    await layerAuthConsumeProtectedLoginAttempt(event, dependencies)
    await layerAuthResetProtectedLoginRateLimit(event, dependencies)

    await expect(layerAuthConsumeProtectedLoginAttempt(event, dependencies))
      .resolves.toEqual({ allowed: true, retryAfterSeconds: 0 })
  })

  it('fails closed when an atomic backend is unavailable', async () => {
    await expect(layerAuthConsumeProtectedLoginAttempt(event, {
      config: { enabled: true, maxAttempts: 1, trustProxy: false, windowSeconds: 60 },
      identifier: '192.0.2.12',
      limiter: {
        consume: async () => { throw new Error('private backend detail') },
        delete: async () => true,
      },
    })).rejects.toMatchObject({ statusCode: 503 })
  })

  it('uses the consumer atomic adapter on request context', async () => {
    const consume = vi.fn().mockResolvedValue({})
    const request = { context: { stirProtectedRateLimiter: { consume, delete: vi.fn() } } } as never

    await layerAuthConsumeProtectedLoginAttempt(request, {
      config: { enabled: true, maxAttempts: 1, trustProxy: false, windowSeconds: 60 },
      identifier: '192.0.2.13',
    })
    expect(consume).toHaveBeenCalledOnce()
    expect(consume.mock.calls[0]?.[0]).not.toContain('192.0.2.13')
  })
})
