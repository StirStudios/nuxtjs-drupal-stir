import {
  appendResponseHeader,
  createError,
  defineEventHandler,
  getHeader,
} from 'h3'
import { buildDrupalHeaders } from '../../utils/drupalHeaders'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const drupalCeConfig =
    config.public.drupalCe && typeof config.public.drupalCe === 'object'
      ? (config.public.drupalCe as Record<string, unknown>)
      : {}
  const drupalApi = String(
    drupalCeConfig.drupalBaseUrl || config.public.api || '',
  ).replace(/\/+$/, '')

  if (!drupalApi) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Drupal API base URL is not configured',
    })
  }

  try {
    const cookie = getHeader(event, 'cookie')
    const response = await $fetch.raw(`${drupalApi}/api/auth/logout`, {
      method: 'POST',
      headers: buildDrupalHeaders({
        cookie: cookie ? String(cookie) : undefined,
        apiKey: String(config.apiKey || ''),
      }),
    })

    const setCookies = response.headers.getSetCookie?.() ?? []

    for (const setCookie of setCookies) {
      appendResponseHeader(event, 'set-cookie', setCookie)
    }

    return response._data
  } catch (error: unknown) {
    const statusCode =
      typeof error === 'object' &&
      error !== null &&
      'statusCode' in error &&
      typeof (error as { statusCode?: unknown }).statusCode === 'number'
        ? (error as { statusCode: number }).statusCode
        : 500
    const statusMessage =
      typeof error === 'object' &&
      error !== null &&
      'statusMessage' in error &&
      typeof (error as { statusMessage?: unknown }).statusMessage === 'string'
        ? (error as { statusMessage: string }).statusMessage
        : 'Logout failed'

    throw createError({ statusCode, statusMessage })
  }
})
