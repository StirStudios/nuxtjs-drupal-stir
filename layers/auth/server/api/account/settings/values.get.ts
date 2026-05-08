import { defineEventHandler } from 'h3'
import { layerAuthDrupalApiRequest, layerAuthThrowDrupalApiError } from '../../../utils/drupalApi'

type SettingsValuesResponse = {
  values?: Record<string, unknown>
}

export default defineEventHandler(async (event) => {
  try {
    return await layerAuthDrupalApiRequest<SettingsValuesResponse>(
      event,
      '/api/account/settings/values',
      {
        method: 'GET',
        forwardCookies: true,
      },
    )
  } catch (error: unknown) {
    layerAuthThrowDrupalApiError(error, 'Failed to load account settings')
  }
})
