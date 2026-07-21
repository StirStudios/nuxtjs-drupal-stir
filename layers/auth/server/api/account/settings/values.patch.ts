import { defineEventHandler, readBody } from 'h3'
import type {
  AccountSettingsUpdateResponse,
  AccountSettingsValuesPayload,
} from '../../../../shared/types/accountSettings'
import { layerAuthDrupalApiRequest, layerAuthThrowDrupalApiError } from '../../../utils/drupalApi'

export default defineEventHandler(async (event) => {
  assertStirSameOrigin(event)

  const body = await readBody<AccountSettingsValuesPayload>(event)
  const values =
    body && typeof body.values === 'object' && body.values !== null
      ? body.values
      : {}

  try {
    return await layerAuthDrupalApiRequest<AccountSettingsUpdateResponse>(
      event,
      '/api/account/settings/values',
      {
        method: 'PATCH',
        forwardCookies: true,
        body: {
          values,
        },
      },
    )
  } catch (error: unknown) {
    layerAuthThrowDrupalApiError(error, 'Failed to update account settings')
  }
})
