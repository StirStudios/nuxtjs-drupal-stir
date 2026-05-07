import { defineEventHandler } from 'h3'
import { layerAuthDrupalApiRequest, layerAuthThrowDrupalApiError } from '../../../utils/drupalApi'

type ProfileSchemaResponse = {
  fields?: Array<Record<string, unknown>>
}

export default defineEventHandler(async (event) => {
  try {
    return await layerAuthDrupalApiRequest<ProfileSchemaResponse>(
      event,
      '/api/account/profile/schema',
      {
        method: 'GET',
        forwardCookies: true,
      },
    )
  } catch (error: unknown) {
    layerAuthThrowDrupalApiError(error, 'Failed to load profile schema')
  }
})
