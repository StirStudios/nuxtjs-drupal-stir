import { defineEventHandler, readBody } from 'h3'
import { layerAuthDrupalApiRequest, layerAuthThrowDrupalApiError } from '../../../utils/drupalApi'

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
    return await layerAuthDrupalApiRequest(event, '/api/auth/password/request', {
      method: 'POST',
      body: {
        identifier,
        turnstile_response: turnstileResponse,
      },
    })
  } catch (error: unknown) {
    layerAuthThrowDrupalApiError(error, 'Password reset request failed')
  }
})
