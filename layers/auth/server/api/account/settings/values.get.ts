import { defineEventHandler } from 'h3'
import type { AccountSettingsValuesResponse } from '../../../../shared/types/accountSettings'
import { layerAuthDrupalApiRequest, layerAuthThrowDrupalApiError } from '../../../utils/drupalApi'

export default defineEventHandler(async (event) => {
  try {
    return await layerAuthDrupalApiRequest<AccountSettingsValuesResponse>(
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
