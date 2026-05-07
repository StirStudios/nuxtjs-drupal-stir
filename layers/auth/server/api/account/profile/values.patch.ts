import { defineEventHandler, readBody } from 'h3'
import { layerAuthDrupalApiRequest, layerAuthThrowDrupalApiError } from '../../../utils/drupalApi'

type ProfileValuesPayload = {
  values?: Record<string, unknown>
}

export default defineEventHandler(async (event) => {
  const body = await readBody<ProfileValuesPayload>(event)
  const values =
    body && typeof body.values === 'object' && body.values !== null
      ? body.values
      : {}

  try {
    return await layerAuthDrupalApiRequest<Record<string, unknown>>(
      event,
      '/api/account/profile/values',
      {
        method: 'PATCH',
        body: { values },
        forwardCookies: true,
      },
    )
  } catch (error: unknown) {
    layerAuthThrowDrupalApiError(error, 'Failed to update profile values')
  }
})
