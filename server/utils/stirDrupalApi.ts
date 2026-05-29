import {
  appendResponseHeader,
  createError,
  getHeader,
  type H3Event,
} from 'h3'

export interface StirDrupalHeaderOptions {
  apiKey?: string
  cookie?: string
  csrfToken?: string
}

export type StirDrupalRequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: Record<string, unknown>
  forwardCookies?: boolean
  forwardSetCookies?: boolean
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
    drupalCeConfig.drupalBaseUrl || config.public.api || '',
  ).replace(/\/+$/, '')
  const apiKey = String(config.apiKey || '')

  if (!baseUrl) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Drupal API base URL is not configured',
    })
  }

  return {
    baseUrl,
    apiKey,
  }
}

export const getStirForwardedCookie = (
  event: H3Event,
): string | undefined => {
  const cookie = getHeader(event, 'cookie')

  return cookie ? String(cookie) : undefined
}

export const appendStirDrupalSetCookies = (
  event: H3Event,
  response: { headers: { getSetCookie?: () => string[] } },
) => {
  const setCookies = response.headers.getSetCookie?.() ?? []

  for (const setCookie of setCookies) {
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
  const statusCode =
    typeof error === 'object' &&
    error !== null &&
    'statusCode' in error &&
    typeof (error as { statusCode?: unknown }).statusCode === 'number'
      ? (error as { statusCode: number }).statusCode
      : fallbackStatusCode
  const payloadMessage = extractStirDrupalErrorDetail(error)
  const statusMessage =
    payloadMessage ||
    (typeof error === 'object' &&
    error !== null &&
    'statusMessage' in error &&
    typeof (error as { statusMessage?: unknown }).statusMessage === 'string'
      ? (error as { statusMessage: string }).statusMessage
      : fallbackMessage)

  throw createError({ statusCode, statusMessage })
}

export async function fetchStirDrupalCsrfToken(
  event: H3Event,
): Promise<string> {
  const { baseUrl, apiKey } = getStirDrupalApiConfig()

  return await $fetch<string>(`${baseUrl}/session/token`, {
    headers: buildStirDrupalHeaders({
      apiKey,
      cookie: getStirForwardedCookie(event),
    }),
  })
}

export async function stirDrupalApiRequest<T>(
  event: H3Event,
  path: string,
  options: StirDrupalRequestOptions = {},
): Promise<T> {
  const { baseUrl, apiKey } = getStirDrupalApiConfig()
  const response = await $fetch.raw<T>(`${baseUrl}${path}`, {
    method: options.method || 'POST',
    body: options.body,
    headers: buildStirDrupalHeaders({
      apiKey,
      cookie: options.forwardCookies ? getStirForwardedCookie(event) : undefined,
    }),
  })

  if (options.forwardSetCookies) {
    appendStirDrupalSetCookies(event, response)
  }

  return response._data as T
}
