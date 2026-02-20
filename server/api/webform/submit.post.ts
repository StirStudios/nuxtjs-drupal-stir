import { defineEventHandler, readBody, createError } from 'h3'

function normalizeErrorStatus(error: unknown): number {
  if (!error || typeof error !== 'object') return 500
  const statusCode =
    (error as { statusCode?: unknown; status?: unknown }).statusCode ??
    (error as { status?: unknown }).status

  return typeof statusCode === 'number' ? statusCode : 500
}

function normalizeErrorMessage(error: unknown): string {
  if (!error || typeof error !== 'object')
    return 'Form submission failed. Please try again later.'

  const statusMessage = (error as { statusMessage?: unknown }).statusMessage

  if (typeof statusMessage === 'string' && statusMessage.trim()) {
    return statusMessage
  }

  const message = (error as { message?: unknown }).message

  if (typeof message === 'string' && message.trim()) {
    return message
  }

  return 'Form submission failed. Please try again later.'
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  try {
    const body = await readBody<Record<string, unknown>>(event)

    if (!body?.webform_id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required fields',
      })
    }

    // Validate Turnstile CAPTCHA
    if (!body.turnstile_response) {
      throw createError({
        statusCode: 400,
        statusMessage: 'CAPTCHA validation failed',
      })
    }

    const { csrfToken } = await $fetch<{ csrfToken: string }>(
      '/api/auth/csrf',
    )

    const drupalApiUrl = `${config.public.api}/api/stir_webform_rest/submit`

    return await $fetch(drupalApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-CSRF-Token': csrfToken,
      },
      body,
    })
  } catch (error) {
    throw createError({
      statusCode: normalizeErrorStatus(error),
      statusMessage: normalizeErrorMessage(error),
    })
  }
})
