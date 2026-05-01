import { defineEventHandler, createError, getHeader } from 'h3'
import { buildDrupalHeaders } from '../../utils/drupalHeaders'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const drupalCeConfig =
    config.public.drupalCe && typeof config.public.drupalCe === 'object'
      ? (config.public.drupalCe as Record<string, unknown>)
      : {}
  const drupalApi = String(drupalCeConfig.drupalBaseUrl || config.public.api || '').replace(/\/+$/, '')
  const apiKey = typeof config.apiKey === 'string' && config.apiKey.trim()
    ? config.apiKey
    : ''

  if (typeof drupalApi !== 'string' || !drupalApi.trim()) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Drupal API base URL is not configured',
    })
  }

  try {
    const cookie = getHeader(event, 'cookie')
    const csrfToken = await $fetch<string>(`${drupalApi}/session/token`, {
      headers: buildDrupalHeaders({
        cookie: cookie ? String(cookie) : undefined,
        apiKey,
      }),
    })

    return { csrfToken }
  } catch {
    throw createError({
      statusCode: 502,
      statusMessage: 'Failed to fetch CSRF token',
    })
  }
})
