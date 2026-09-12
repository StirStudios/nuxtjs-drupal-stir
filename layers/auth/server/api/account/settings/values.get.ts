import { defineEventHandler } from 'h3'
import type { AccountSettingsValuesResponse } from '../../../../shared/types/accountSettings'
import { layerAuthDrupalApiRequest } from '../../../utils/drupalApi'
import { throwStirDrupalApiError } from '../../../../../foundation/server/utils/stirDrupalApi'

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
    throwStirDrupalApiError(error, 'Failed to load account settings')
  }
})
