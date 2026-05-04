import { createError, defineEventHandler, readBody } from 'h3'
import { buildDrupalHeaders } from '../../../utils/drupalHeaders'

export default defineEventHandler(async (event) => {
  const body = await readBody<{
    uid?: unknown
    timestamp?: unknown
    hash?: unknown
    password?: unknown
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

  const uid =
    typeof body?.uid === 'number'
      ? body.uid
      : Number.parseInt(String(body?.uid ?? '0'), 10)
  const timestamp =
    typeof body?.timestamp === 'number'
      ? body.timestamp
      : Number.parseInt(String(body?.timestamp ?? '0'), 10)
  const hash = typeof body?.hash === 'string' ? body.hash.trim() : ''
  const password =
    typeof body?.password === 'string' ? body.password.trim() : ''

  try {
    return await $fetch(`${drupalApi}/api/auth/password/reset`, {
      method: 'POST',
      body: {
        uid,
        timestamp,
        hash,
        password,
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
        : 'Password reset failed'

    throw createError({ statusCode, statusMessage })
  }
})

