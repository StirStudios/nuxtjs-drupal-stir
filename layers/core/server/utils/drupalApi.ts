import {
  appendResponseHeader,
  createError,
  getHeader,
  type H3Event,
} from 'h3'
import { buildDrupalHeaders } from './drupalHeaders'

export function getDrupalApiConfig() {
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

export const getForwardedCookie = (event: H3Event): string | undefined => {
  const cookie = getHeader(event, 'cookie')

  return cookie ? String(cookie) : undefined
}

export const appendDrupalSetCookies = (
  event: H3Event,
  response: { headers: { getSetCookie?: () => string[] } },
) => {
  const setCookies = response.headers.getSetCookie?.() ?? []

  for (const setCookie of setCookies) {
    appendResponseHeader(event, 'set-cookie', setCookie)
  }
}

export const throwDrupalApiError = (
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

  const payloadMessage = (() => {
    if (typeof error !== 'object' || error === null || !('data' in error)) {
      return ''
    }

    const data = (error as { data?: unknown }).data

    if (typeof data !== 'object' || data === null) {
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
  })()

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

type DrupalRequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: Record<string, unknown>
  forwardCookies?: boolean
  forwardSetCookies?: boolean
}

export async function drupalApiRequest<T>(
  event: H3Event,
  path: string,
  options: DrupalRequestOptions = {},
): Promise<T> {
  const { baseUrl, apiKey } = getDrupalApiConfig()
  const response = await $fetch.raw<T>(`${baseUrl}${path}`, {
    method: options.method || 'POST',
    body: options.body,
    headers: buildDrupalHeaders({
      apiKey,
      cookie: options.forwardCookies ? getForwardedCookie(event) : undefined,
    }),
  })

  if (options.forwardSetCookies) {
    appendDrupalSetCookies(event, response)
  }

  return response._data as T
}
