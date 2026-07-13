import { createError, defineEventHandler, readBody } from 'h3'
import {
  layerAuthDrupalApiRequest,
  layerAuthThrowDrupalApiError,
} from '../../utils/drupalApi'

export default defineEventHandler(async (event) => {
  assertStirSameOrigin(event)

  const body = await readBody<{
    identifier?: unknown
    password?: unknown
    turnstile_response?: unknown
  }>(event)

  const identifier =
    typeof body?.identifier === 'string' ? body.identifier.trim() : ''
  const password = typeof body?.password === 'string' ? body.password : ''
  const turnstileResponse =
    typeof body?.turnstile_response === 'string'
      ? body.turnstile_response.trim()
      : ''

  if (!identifier || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Identifier and password are required',
    })
  }

  try {
    return await layerAuthDrupalApiRequest(event, '/api/auth/login', {
      method: 'POST',
      body: {
        identifier,
        password,
        turnstile_response: turnstileResponse,
      },
      forwardCookies: true,
      forwardSetCookies: true,
    })
  } catch (error: unknown) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'statusCode' in error &&
      (error as { statusCode?: unknown }).statusCode === 404
    ) {
      throw createError({
        statusCode: 502,
        statusMessage: 'Authentication service is unavailable',
      })
    }

    layerAuthThrowDrupalApiError(error, 'Invalid credentials', 401)
  }
})
