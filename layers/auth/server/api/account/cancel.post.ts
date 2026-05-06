import { defineEventHandler } from 'h3'
import { drupalApiRequest, throwDrupalApiError } from '../../utils/drupalApi'

export default defineEventHandler(async (event) => {
  try {
    return await drupalApiRequest<Record<string, unknown>>(
      event,
      '/api/account/cancel',
      {
        method: 'POST',
        forwardCookies: true,
      },
    )
  } catch (error: unknown) {
    throwDrupalApiError(error, 'Failed to cancel account')
  }
})
