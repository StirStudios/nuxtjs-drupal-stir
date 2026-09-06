import { createError, getRequestIP, type H3Event } from 'h3'
import { RateLimiterMemory } from 'rate-limiter-flexible'

const DEFAULT_MAX_ATTEMPTS = 5
const DEFAULT_WINDOW_SECONDS = 15 * 60
const STORAGE_BASE = 'stir:protected-login'

export type LayerAuthProtectedRateLimitConfig = {
  enabled: boolean
  maxAttempts: number
  trustProxy: boolean
  windowSeconds: number
}

/** Consume must atomically reserve an attempt or reject with msBeforeNext. */
export type LayerAuthProtectedRateLimiter = {
  consume: (key: string) => Promise<unknown>
  delete: (key: string) => Promise<unknown>
}

declare module 'h3' {
  interface H3EventContext {
    stirProtectedRateLimiter?: LayerAuthProtectedRateLimiter
  }
}

export type LayerAuthProtectedRateLimitDependencies = {
  config?: LayerAuthProtectedRateLimitConfig
  identifier?: string
  limiter?: LayerAuthProtectedRateLimiter
}

let memoryLimiter: { signature: string, limiter: RateLimiterMemory } | undefined

const getMemoryLimiter = (config: LayerAuthProtectedRateLimitConfig) => {
  const signature = `${config.maxAttempts}:${config.windowSeconds}`

  if (memoryLimiter?.signature !== signature) {
    memoryLimiter = {
      signature,
      limiter: new RateLimiterMemory({
        points: config.maxAttempts,
        duration: config.windowSeconds,
      }),
    }
  }

  return memoryLimiter.limiter
}

export type LayerAuthProtectedRateLimitStatus = {
  allowed: boolean
  retryAfterSeconds: number
}

const normalizePositiveInteger = (
  value: unknown,
  fallback: number,
): number => {
  const parsed = Number(value)

  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

export const layerAuthGetProtectedRateLimitConfig = (
  runtimeConfig: ReturnType<typeof useRuntimeConfig> = useRuntimeConfig(),
): LayerAuthProtectedRateLimitConfig => {
  const rawConfig = (runtimeConfig as Record<string, unknown>).protectedRateLimit
  const config = rawConfig && typeof rawConfig === 'object'
    ? rawConfig as Record<string, unknown>
    : {}

  return {
    enabled: config.enabled !== false,
    maxAttempts: normalizePositiveInteger(
      config.maxAttempts,
      DEFAULT_MAX_ATTEMPTS,
    ),
    trustProxy: config.trustProxy === true,
    windowSeconds: normalizePositiveInteger(
      config.windowSeconds,
      DEFAULT_WINDOW_SECONDS,
    ),
  }
}

const hashIdentifier = async (identifier: string): Promise<string> => {
  const data = new TextEncoder().encode(identifier)
  const digest = await crypto.subtle.digest('SHA-256', data)

  return Array.from(new Uint8Array(digest), byte =>
    byte.toString(16).padStart(2, '0')).join('')
}

const getRateLimitKey = async (
  event: H3Event,
  identifier?: string,
  trustProxy = false,
): Promise<string> => {
  let requestIp = ''

  if (!identifier) {
    try {
      requestIp = getRequestIP(event, { xForwardedFor: trustProxy }) || ''
    } catch {
      requestIp = ''
    }
  }

  const clientIdentifier = identifier || requestIp || 'unknown'

  return `${STORAGE_BASE}:${await hashIdentifier(clientIdentifier)}`
}

const getDependencies = async (
  event: H3Event,
  dependencies: LayerAuthProtectedRateLimitDependencies,
) => {
  const config = dependencies.config || layerAuthGetProtectedRateLimitConfig()

  return {
    config,
    key: await getRateLimitKey(
      event,
      dependencies.identifier,
      config.trustProxy,
    ),
    limiter: config.enabled
      ? dependencies.limiter || event.context?.stirProtectedRateLimiter || getMemoryLimiter(config)
      : undefined,
  }
}

export const layerAuthConsumeProtectedLoginAttempt = async (
  event: H3Event,
  dependencies: LayerAuthProtectedRateLimitDependencies = {},
): Promise<LayerAuthProtectedRateLimitStatus> => {
  const { key, limiter } = await getDependencies(event, dependencies)

  if (!limiter) return { allowed: true, retryAfterSeconds: 0 }

  try {
    await limiter.consume(key)
    return { allowed: true, retryAfterSeconds: 0 }
  } catch (error) {
    if (error && typeof error === 'object' && 'msBeforeNext' in error
      && typeof error.msBeforeNext === 'number' && Number.isFinite(error.msBeforeNext)) {
      return {
        allowed: false,
        retryAfterSeconds: Math.max(1, Math.ceil(error.msBeforeNext / 1000)),
      }
    }

    throw createError({
      statusCode: 503,
      statusMessage: 'Login is temporarily unavailable. Please try again later',
    })
  }
}

export const layerAuthResetProtectedLoginRateLimit = async (
  event: H3Event,
  dependencies: LayerAuthProtectedRateLimitDependencies = {},
): Promise<void> => {
  const { key, limiter } = await getDependencies(event, dependencies)

  try {
    await limiter?.delete(key)
  } catch {
    // A successful login must not fail because cleanup storage is unavailable.
  }
}
