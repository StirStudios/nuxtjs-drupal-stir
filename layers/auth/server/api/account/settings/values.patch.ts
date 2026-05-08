import { defineEventHandler, readBody } from 'h3'
import { layerAuthDrupalApiRequest, layerAuthThrowDrupalApiError } from '../../../utils/drupalApi'

type SettingsValuesPayload = {
  values?: Record<string, unknown>
}

export default defineEventHandler(async (event) => {
  const body = await readBody<SettingsValuesPayload>(event)
  const values =
    body && typeof body.values === 'object' && body.values !== null
      ? body.values
      : {}

  try {
    return await layerAuthDrupalApiRequest<Record<string, unknown>>(
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
