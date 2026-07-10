import { createError, defineEventHandler, readBody } from 'h3'
import { layerAuthDrupalApiRequest, layerAuthThrowDrupalApiError } from '../../utils/drupalApi'

export default defineEventHandler(async (event) => {
  const body = await readBody<{
    email?: unknown
    password?: unknown
    display_name?: unknown
    turnstile_response?: unknown
    fields?: unknown
  }>(event)

  const email = typeof body?.email === 'string' ? body.email.trim() : ''
  const password = typeof body?.password === 'string' ? body.password : ''
  const displayName =
    typeof body?.display_name === 'string' ? body.display_name.trim() : ''
  const turnstileResponse =
    typeof body?.turnstile_response === 'string'
      ? body.turnstile_response.trim()
      : ''
  const fields = body?.fields && typeof body.fields === 'object' && !Array.isArray(body.fields)
    ? body.fields as Record<string, unknown>
    : {}

  if (!email || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email and password are required',
    })
  }

  try {
    return await layerAuthDrupalApiRequest(event, '/api/auth/register', {
      method: 'POST',
      body: {
        email,
        password,
        display_name: displayName,
        turnstile_response: turnstileResponse,
        fields,
      },
    })
  } catch (error: unknown) {
    layerAuthThrowDrupalApiError(error, 'Registration failed')
  }
})
