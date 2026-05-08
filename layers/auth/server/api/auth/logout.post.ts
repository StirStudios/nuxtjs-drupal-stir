import { defineEventHandler } from 'h3'
import { layerAuthDrupalApiRequest, layerAuthThrowDrupalApiError } from '../../utils/drupalApi'

export default defineEventHandler(async (event) => {
  try {
    return await layerAuthDrupalApiRequest(event, '/api/auth/logout', {
      method: 'POST',
      forwardCookies: true,
      forwardSetCookies: true,
    })
  } catch (error: unknown) {
    layerAuthThrowDrupalApiError(error, 'Logout failed')
  }
})
