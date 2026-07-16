import {
  appendResponseHeader,
  createError,
  getHeader,
  getRequestIP,
  removeResponseHeader,
  setResponseHeader,
  splitCookiesString,
  type H3Event,
} from 'h3'

// Shared by focused server capabilities and the full Drupal CE platform.
const DEFAULT_DRUPAL_REQUEST_TIMEOUT_MS = 10_000
const PRIVATE_NO_STORE = 'private, no-store, max-age=0'
const DRUPAL_SESSION_COOKIE_NAME = /^S?SESS[A-Za-z0-9_-]{32}$/
const SAFE_CUSTOM_COOKIE_NAME = /^[A-Za-z0-9_-]{1,128}$/
const SAFE_UPSTREAM_STATUS_CODES = new Set([
  400,
  401,
  403,
  404,
  409,
  413,
  422,
  429,
])

export interface StirDrupalHeaderOptions {
  apiKey?: string
  clientIp?: string
  cookie?: string
  csrfToken?: string
}

export type StirDrupalRequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: Record<string, unknown>
  forwardClientIp?: boolean
  forwardCookies?: boolean
  forwardSetCookies?: boolean
}

const normalizePositiveInteger = (
  value: unknown,
  fallback: number,
): number => {
  const parsed = Number(value)

  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

const stringList = (value: unknown): string[] => {
  if (!Array.isArray(value)) return []

  return value
    .filter((entry): entry is string => typeof entry === 'string')
    .map(entry => entry.trim())
    .filter(entry => SAFE_CUSTOM_COOKIE_NAME.test(entry))
}

export const getStirDrupalSessionCookieNames = (
  runtimeConfig?: ReturnType<typeof useRuntimeConfig>,
): string[] => {
  try {
    const config = runtimeConfig || useRuntimeConfig()

    return stringList(
      (config as Record<string, unknown>).drupalSessionCookieNames,
    )
  } catch {
    return []
  }
}

export const isStirDrupalSessionCookieName = (
  name: string,
  configuredNames: readonly string[] = [],
): boolean =>
  DRUPAL_SESSION_COOKIE_NAME.test(name) || configuredNames.includes(name)

export const filterStirDrupalSessionCookies = (
  cookieHeader: string,
  configuredNames: readonly string[] = [],
): string | undefined => {
  const sessionCookies = cookieHeader
    .split(';')
    .map(cookie => cookie.trim())
    .filter(Boolean)
    .filter((cookie) => {
      const separatorIndex = cookie.indexOf('=')
      const name = separatorIndex >= 0
        ? cookie.slice(0, separatorIndex).trim()
        : cookie

      return isStirDrupalSessionCookieName(name, configuredNames)
    })

  return sessionCookies.length > 0 ? sessionCookies.join('; ') : undefined
}

export function buildStirDrupalHeaders(
  options: StirDrupalHeaderOptions = {},
): Record<string, string> {
  const headers: Record<string, string> = {}

  if (typeof options.cookie === 'string' && options.cookie.trim()) {
    headers.cookie = options.cookie
  }

  if (typeof options.apiKey === 'string' && options.apiKey.trim()) {
    headers['x-api-key'] = options.apiKey
  }

  if (typeof options.clientIp === 'string' && options.clientIp.trim()) {
    headers['x-forwarded-for'] = options.clientIp
  }

  if (typeof options.csrfToken === 'string' && options.csrfToken.trim()) {
    headers['x-csrf-token'] = options.csrfToken
  }

  return headers
}

export function getStirDrupalApiConfig() {
  const config = useRuntimeConfig()
  const drupalCeConfig =
    config.public.drupalCe && typeof config.public.drupalCe === 'object'
      ? (config.public.drupalCe as Record<string, unknown>)
      : {}

  const baseUrl = String(
    drupalCeConfig.serverDrupalBaseUrl
    || config.api
    || drupalCeConfig.drupalBaseUrl
    || config.public.api
    || '',
  ).replace(/\/+$/, '')
  const apiKey = String(config.apiKey || '')
  const requestTimeoutMs = normalizePositiveInteger(
    (config as Record<string, unknown>).drupalRequestTimeoutMs,
    DEFAULT_DRUPAL_REQUEST_TIMEOUT_MS,
  )

  if (!baseUrl) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Drupal API base URL is not configured',
    })
  }

  return {
    baseUrl,
    apiKey,
    requestTimeoutMs,
  }
}

export const getStirForwardedCookie = (
  event: H3Event,
): string | undefined => {
  const cookie = getHeader(event, 'cookie')

  return cookie
    ? filterStirDrupalSessionCookies(
        String(cookie),
        getStirDrupalSessionCookieNames(),
      )
    : undefined
}

const isIpv4 = (value: string): boolean => {
  const parts = value.split('.')

  return parts.length === 4 && parts.every((part) => {
    if (!/^\d{1,3}$/.test(part)) return false

    const octet = Number(part)

    return octet >= 0 && octet <= 255
  })
}

const isIpv6 = (value: string): boolean => {
  if (!value.includes(':') || !/^[0-9a-f:]+$/i.test(value)) return false

  const compressed = value.split('::')

  if (compressed.length > 2) return false

  const segments = compressed
    .flatMap(part => part.split(':'))
    .filter(Boolean)

  if (!segments.every(segment => /^[0-9a-f]{1,4}$/i.test(segment))) {
    return false
  }

  return compressed.length === 2 ? segments.length < 8 : segments.length === 8
}

const normalizeClientIp = (value: string | undefined): string | undefined => {
  const normalized = value?.trim().replace(/^::ffff:/, '')

  if (!normalized || normalized.length > 45) return undefined
  if (!isIpv4(normalized) && !isIpv6(normalized)) return undefined

  return normalized
}

export const getStirForwardedClientIp = (
  event: H3Event,
): string | undefined => {
  const config = useRuntimeConfig() as Record<string, unknown>
  const rawConfig = config.drupalClientIpForwarding
  const forwarding = rawConfig && typeof rawConfig === 'object'
    ? rawConfig as Record<string, unknown>
    : {}

  if (forwarding.enabled !== true) return undefined

  try {
    return normalizeClientIp(getRequestIP(event, {
      xForwardedFor: forwarding.trustProxy === true,
    }))
  } catch {
    return undefined
  }
}

export const markStirPrivateResponse = (event: H3Event): void => {
  setResponseHeader(event, 'Cache-Control', PRIVATE_NO_STORE)
}

export const captureStirDrupalApiError = (
  event: H3Event,
  error: unknown,
): void => {
  try {
    const capturedError = error instanceof Error
      ? error
      : new Error('Drupal upstream request failed')

    useNitroApp().captureError(capturedError, {
      event,
      tags: ['stir-drupal-api'],
    })
  } catch {
    // Error capture must never replace the original upstream failure.
  }
}

export const appendStirDrupalSetCookies = (
  event: H3Event,
  response: { headers: StirDrupalResponseHeaders },
) => {
  const setCookies = getStirDrupalSetCookies(response.headers)

  for (const setCookie of filterStirDrupalSetCookies(setCookies)) {
    appendResponseHeader(event, 'set-cookie', setCookie)
  }
}

interface StirDrupalResponseHeaders {
  get?: (name: string) => string | null
  getSetCookie?: () => string[]
}

export const getStirDrupalSetCookies = (
  headers: StirDrupalResponseHeaders,
): string[] => {
  if (typeof headers.getSetCookie === 'function') {
    return headers.getSetCookie()
  }

  const combinedHeader = headers.get?.('set-cookie')

  return combinedHeader ? splitCookiesString(combinedHeader) : []
}

export const filterStirDrupalSetCookies = (
  setCookies: readonly string[],
  configuredNames: readonly string[] = getStirDrupalSessionCookieNames(),
): string[] => {
  return setCookies.filter((setCookie) => {
    const separatorIndex = setCookie.indexOf('=')

    if (separatorIndex <= 0) return false

    const cookieName = setCookie.slice(0, separatorIndex).trim()

    return isStirDrupalSessionCookieName(cookieName, configuredNames)
  })
}

export const replaceStirDrupalSetCookies = (
  event: H3Event,
  response: { headers: StirDrupalResponseHeaders },
): void => {
  const setCookies = getStirDrupalSetCookies(response.headers)

  if (setCookies.length === 0) return

  removeResponseHeader(event, 'set-cookie')

  for (const setCookie of filterStirDrupalSetCookies(setCookies)) {
    appendResponseHeader(event, 'set-cookie', setCookie)
  }
}

export const extractStirDrupalErrorDetail = (error: unknown): string => {
  if (!error || typeof error !== 'object' || !('data' in error)) {
    return ''
  }

  const data = (error as { data?: unknown }).data

  if (!data || typeof data !== 'object') {
    return ''
  }

  const dataRecord = data as Record<string, unknown>
  const primary =
    typeof dataRecord.error === 'string'
      ? dataRecord.error
      : typeof dataRecord.message === 'string'
        ? dataRecord.message
        : ''

  const fieldErrors =
    typeof dataRecord.errors === 'object' && dataRecord.errors !== null
      ? Object.entries(dataRecord.errors as Record<string, unknown>)
          .map(([key, value]) =>
            typeof value === 'string' && value.trim().length > 0
              ? `${key}: ${value}`
              : '',
          )
          .filter((entry) => entry.length > 0)
      : []

  if (primary && fieldErrors.length > 0) {
    return `${primary} ${fieldErrors.join(' | ')}`
  }

  if (fieldErrors.length > 0) {
    return fieldErrors.join(' | ')
  }

  return primary
}

export const throwStirDrupalApiError = (
  error: unknown,
  fallbackMessage = 'Request failed',
  fallbackStatusCode = 500,
): never => {
  const upstreamStatusCode =
    typeof error === 'object' &&
    error !== null &&
    (('statusCode' in error &&
      typeof (error as { statusCode?: unknown }).statusCode === 'number') ||
      ('status' in error &&
        typeof (error as { status?: unknown }).status === 'number'))
      ? Number(
          (error as { statusCode?: number; status?: number }).statusCode
          ?? (error as { status?: number }).status,
        )
      : undefined
  const safeUpstreamError = upstreamStatusCode !== undefined &&
    SAFE_UPSTREAM_STATUS_CODES.has(upstreamStatusCode)
  const statusCode = upstreamStatusCode !== undefined
    ? safeUpstreamError
      ? upstreamStatusCode
      : 502
    : SAFE_UPSTREAM_STATUS_CODES.has(fallbackStatusCode)
      ? fallbackStatusCode
      : 502

  const upstreamDetail = safeUpstreamError
    ? extractStirDrupalErrorDetail(error).trim()
    : ''

  throw createError({
    statusCode,
    statusMessage: upstreamDetail || fallbackMessage,
  })
}

export const assertStirDrupalResponseNotRedirect = (
  response: { status?: number },
): void => {
  if (
    typeof response.status === 'number'
    && response.status >= 300
    && response.status < 400
  ) {
    throw createError({
      statusCode: 502,
      statusMessage: 'Drupal upstream redirect was rejected',
    })
  }
}

export async function fetchStirDrupalCsrfToken(
  event: H3Event,
): Promise<string> {
  const { baseUrl, apiKey, requestTimeoutMs } = getStirDrupalApiConfig()
  const cookie = getStirForwardedCookie(event)

  if (cookie) {
    markStirPrivateResponse(event)
  }

  try {
    const response = await $fetch.raw<string>(`${baseUrl}/session/token`, {
      headers: buildStirDrupalHeaders({
        apiKey,
        cookie,
      }),
      redirect: 'manual',
      timeout: requestTimeoutMs,
    })

    assertStirDrupalResponseNotRedirect(response)

    return response._data as string
  } catch (error) {
    captureStirDrupalApiError(event, error)
    throw error
  }
}

export async function stirDrupalApiRequest<T>(
  event: H3Event,
  path: string,
  options: StirDrupalRequestOptions = {},
): Promise<T> {
  const { baseUrl, apiKey, requestTimeoutMs } = getStirDrupalApiConfig()
  const cookie = options.forwardCookies
    ? getStirForwardedCookie(event)
    : undefined
  const clientIp = options.forwardClientIp
    ? getStirForwardedClientIp(event)
    : undefined
  const method = options.method || 'POST'
  const csrfToken = cookie && method !== 'GET'
    ? await fetchStirDrupalCsrfToken(event)
    : undefined

  if (cookie) {
    markStirPrivateResponse(event)
  }

  let response

  try {
    response = await $fetch.raw<T>(`${baseUrl}${path}`, {
      method,
      body: options.body,
      headers: buildStirDrupalHeaders({
        apiKey,
        clientIp,
        cookie,
        csrfToken,
      }),
      redirect: 'manual',
      timeout: requestTimeoutMs,
    })
  } catch (error) {
    captureStirDrupalApiError(event, error)
    throw error
  }

  assertStirDrupalResponseNotRedirect(response)

  if (options.forwardSetCookies) {
    appendStirDrupalSetCookies(event, response)
  }

  return response._data as T
}
