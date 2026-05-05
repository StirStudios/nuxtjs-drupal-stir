import { defineEventHandler, readBody } from 'h3'
import { drupalApiRequest, throwDrupalApiError } from '../../utils/drupalApi'

export default defineEventHandler(async (event) => {
  const body = await readBody<{
    email?: unknown
    password?: unknown
    display_name?: unknown
    turnstile_response?: unknown
  }>(event)

  const email = typeof body?.email === 'string' ? body.email.trim() : ''
  const password = typeof body?.password === 'string' ? body.password.trim() : ''
  const displayName =
    typeof body?.display_name === 'string' ? body.display_name.trim() : ''
  const turnstileResponse =
    typeof body?.turnstile_response === 'string'
      ? body.turnstile_response.trim()
      : ''

  try {
    return await drupalApiRequest(event, '/api/auth/register', {
      method: 'POST',
      body: {
        email,
        password,
        display_name: displayName,
        turnstile_response: turnstileResponse,
      },
    })
  } catch (error: unknown) {
    throwDrupalApiError(error, 'Registration failed')
  }
})
