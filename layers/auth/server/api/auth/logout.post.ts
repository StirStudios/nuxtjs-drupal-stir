import { defineEventHandler } from 'h3'
import { layerAuthDrupalApiRequest } from '../../utils/drupalApi'
import { throwStirDrupalApiError } from '../../../../foundation/server/utils/stirDrupalApi'

export default defineEventHandler(async (event) => {
  assertStirSameOrigin(event)

  try {
    return await layerAuthDrupalApiRequest(event, '/api/auth/logout', {
      method: 'POST',
      forwardCookies: true,
      forwardSetCookies: true,
    })
  } catch (error: unknown) {
    throwStirDrupalApiError(error, 'Logout failed')
  }
})
