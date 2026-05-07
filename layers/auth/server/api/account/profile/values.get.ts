import { defineEventHandler } from 'h3'
import { layerAuthDrupalApiRequest, layerAuthThrowDrupalApiError } from '../../../utils/drupalApi'

type ProfileValuesResponse = {
  values?: Record<string, unknown>
}

export default defineEventHandler(async (event) => {
  try {
    return await layerAuthDrupalApiRequest<ProfileValuesResponse>(
      event,
      '/api/account/profile/values',
      {
        method: 'GET',
        forwardCookies: true,
      },
    )
  } catch (error: unknown) {
    layerAuthThrowDrupalApiError(error, 'Failed to load profile values')
  }
})
