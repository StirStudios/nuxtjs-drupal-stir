import { getRequestIP, type H3Event } from 'h3'

const DEFAULT_MAX_ATTEMPTS = 5
const DEFAULT_WINDOW_SECONDS = 15 * 60
const STORAGE_BASE = 'stir:protected-login'

type ProtectedRateLimitRecord = {
  failures: number
  resetAt: number
}

export type LayerAuthProtectedRateLimitConfig = {
  enabled: boolean
  maxAttempts: number
  trustProxy: boolean
  windowSeconds: number
}

export type LayerAuthProtectedRateLimitStorage = {
  getItem: <T>(key: string) => Promise<T | null>
  setItem: <T>(
    key: string,
    value: T,
    options?: Record<string, unknown>,
  ) => Promise<void>
  removeItem: (key: string) => Promise<void>
}

export type LayerAuthProtectedRateLimitDependencies = {
  config?: LayerAuthProtectedRateLimitConfig
  identifier?: string
  now?: () => number
  storage?: LayerAuthProtectedRateLimitStorage
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
    now: dependencies.now?.() ?? Date.now(),
    storage: dependencies.storage
      || (config.enabled
        ? useStorage('cache') as LayerAuthProtectedRateLimitStorage
        : undefined),
  }
}

export const layerAuthCheckProtectedLoginRateLimit = async (
  event: H3Event,
  dependencies: LayerAuthProtectedRateLimitDependencies = {},
): Promise<LayerAuthProtectedRateLimitStatus> => {
  const { config, key, now, storage } = await getDependencies(event, dependencies)

  if (!config.enabled) {
    return { allowed: true, retryAfterSeconds: 0 }
  }

  try {
    if (!storage) return { allowed: true, retryAfterSeconds: 0 }

    const record = await storage.getItem<ProtectedRateLimitRecord>(key)

    if (!record || record.resetAt <= now || record.failures < config.maxAttempts) {
      return { allowed: true, retryAfterSeconds: 0 }
    }

    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((record.resetAt - now) / 1000)),
    }
  } catch {
    return { allowed: true, retryAfterSeconds: 0 }
  }
}

export const layerAuthRecordProtectedLoginFailure = async (
  event: H3Event,
  dependencies: LayerAuthProtectedRateLimitDependencies = {},
): Promise<void> => {
  const { config, key, now, storage } = await getDependencies(event, dependencies)

  if (!config.enabled) return

  try {
    if (!storage) return

    const existing = await storage.getItem<ProtectedRateLimitRecord>(key)
    const record = existing && existing.resetAt > now
      ? existing
      : {
          failures: 0,
          resetAt: now + config.windowSeconds * 1000,
        }

    await storage.setItem(
      key,
      {
        failures: record.failures + 1,
        resetAt: record.resetAt,
      },
      { ttl: config.windowSeconds },
    )
  } catch {
    // Authentication still fails closed if rate-limit storage is unavailable.
  }
}

export const layerAuthResetProtectedLoginRateLimit = async (
  event: H3Event,
  dependencies: LayerAuthProtectedRateLimitDependencies = {},
): Promise<void> => {
  const { config, key, storage } = await getDependencies(event, dependencies)

  if (!config.enabled) return

  try {
    if (!storage) return

    await storage.removeItem(key)
  } catch {
    // A successful login must not fail because cleanup storage is unavailable.
  }
}
