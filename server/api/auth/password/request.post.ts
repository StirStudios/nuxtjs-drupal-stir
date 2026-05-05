import { defineEventHandler, readBody } from 'h3'
import { drupalApiRequest, throwDrupalApiError } from '../../../utils/drupalApi'

export default defineEventHandler(async (event) => {
  const body = await readBody<{
    identifier?: unknown
    turnstile_response?: unknown
  }>(event)

  const identifier =
    typeof body?.identifier === 'string' ? body.identifier.trim() : ''
  const turnstileResponse =
    typeof body?.turnstile_response === 'string'
      ? body.turnstile_response.trim()
      : ''

  try {
    return await drupalApiRequest(event, '/api/auth/password/request', {
      method: 'POST',
      body: {
        identifier,
        turnstile_response: turnstileResponse,
      },
    })
  } catch (error: unknown) {
    throwDrupalApiError(error, 'Password reset request failed')
  }
})
