import { defineEventHandler } from 'h3'
import { drupalApiRequest, throwDrupalApiError } from '~~/server/utils/drupalApi'

export default defineEventHandler(async (event) => {
  try {
    return await drupalApiRequest(event, '/api/auth/logout', {
      method: 'POST',
      forwardCookies: true,
      forwardSetCookies: true,
    })
  } catch (error: unknown) {
    throwDrupalApiError(error, 'Logout failed')
  }
})
