import { createError, defineEventHandler, readBody } from 'h3'
import { buildDrupalHeaders } from '../../../utils/drupalHeaders'

export default defineEventHandler(async (event) => {
  const body = await readBody<{
    identifier?: unknown
    turnstile_response?: unknown
  }>(event)
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

  const identifier =
    typeof body?.identifier === 'string' ? body.identifier.trim() : ''
  const turnstileResponse =
    typeof body?.turnstile_response === 'string'
      ? body.turnstile_response.trim()
      : ''

  try {
    return await $fetch(`${drupalApi}/api/auth/password/request`, {
      method: 'POST',
      body: {
        identifier,
        turnstile_response: turnstileResponse,
      },
      headers: buildDrupalHeaders({
        apiKey: String(config.apiKey || ''),
      }),
    })
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
        : 'Password reset request failed'

    throw createError({ statusCode, statusMessage })
  }
})

