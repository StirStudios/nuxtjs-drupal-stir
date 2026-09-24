import { createError, defineEventHandler, readBody } from 'h3'
import { layerAuthDrupalApiRequest } from '../../../utils/drupalApi'
import { throwStirDrupalApiError } from '../../../../../foundation/server/utils/stirDrupalApi'
import { assertStirSameOrigin } from '../../../../../foundation/server/utils/stirRequestSecurity'

// Drupal answers the same way whether or not the account exists, and rate
// limits by identifier and client IP.
export default defineEventHandler(async (event) => {
  assertStirSameOrigin(event)

  const body = await readBody<{ identifier?: unknown }>(event)
  const identifier =
    typeof body?.identifier === 'string' ? body.identifier.trim() : ''

  if (!identifier) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Identifier is required',
    })
  }

  try {
    return await layerAuthDrupalApiRequest(event, '/api/auth/verify/resend', {
      method: 'POST',
      body: { identifier },
    })
  } catch (error: unknown) {
    throwStirDrupalApiError(error, 'Verification email request failed')
  }
})
