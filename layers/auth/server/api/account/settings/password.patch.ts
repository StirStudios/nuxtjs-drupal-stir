import { defineEventHandler, readBody } from 'h3'
import { layerAuthDrupalApiRequest } from '../../../utils/drupalApi'
import { throwStirDrupalApiError } from '../../../../../foundation/server/utils/stirDrupalApi'

type PasswordPayload = {
  current_password?: unknown
  new_password?: unknown
}

export default defineEventHandler(async (event) => {
  assertStirSameOrigin(event)

  const body = await readBody<PasswordPayload>(event)

  const currentPassword =
    typeof body?.current_password === 'string' ? body.current_password : ''
  const newPassword =
    typeof body?.new_password === 'string' ? body.new_password : ''

  try {
    return await layerAuthDrupalApiRequest<Record<string, unknown>>(
      event,
      '/api/account/password',
      {
        method: 'PATCH',
        body: {
          current_password: currentPassword,
          new_password: newPassword,
        },
        forwardCookies: true,
        forwardSetCookies: true,
      },
    )
  } catch (error: unknown) {
    throwStirDrupalApiError(error, 'Failed to update password')
  }
})
