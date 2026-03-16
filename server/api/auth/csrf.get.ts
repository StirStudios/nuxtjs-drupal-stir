import { defineEventHandler, createError } from 'h3'

export default defineEventHandler(async () => {
  const config = useRuntimeConfig()
  const drupalApi = config.public.api

  if (typeof drupalApi !== 'string' || !drupalApi.trim()) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Drupal API base URL is not configured',
    })
  }

  try {
    const csrfToken = await $fetch(`${drupalApi}/session/token`)

    return { csrfToken }
  } catch {
    throw createError({
      statusCode: 502,
      statusMessage: 'Failed to fetch CSRF token',
    })
  }
})
