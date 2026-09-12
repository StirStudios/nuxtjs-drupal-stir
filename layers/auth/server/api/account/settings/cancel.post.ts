import { defineEventHandler } from 'h3'
import { layerAuthDrupalApiRequest } from '../../../utils/drupalApi'
import { throwStirDrupalApiError } from '../../../../../foundation/server/utils/stirDrupalApi'

export default defineEventHandler(async (event) => {
  assertStirSameOrigin(event)

  try {
    return await layerAuthDrupalApiRequest<Record<string, unknown>>(
      event,
      '/api/account/cancel',
      {
        method: 'POST',
        forwardCookies: true,
        forwardSetCookies: true,
      },
    )
  } catch (error: unknown) {
    throwStirDrupalApiError(error, 'Failed to cancel account')
  }
})
