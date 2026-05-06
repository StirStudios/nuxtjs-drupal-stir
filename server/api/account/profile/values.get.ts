import { defineEventHandler } from 'h3'
import { drupalApiRequest, throwDrupalApiError } from '../../../utils/drupalApi'

type ProfileValuesResponse = {
  values?: Record<string, unknown>
}

export default defineEventHandler(async (event) => {
  try {
    return await drupalApiRequest<ProfileValuesResponse>(
      event,
      '/api/account/profile/values',
      {
        method: 'GET',
        forwardCookies: true,
      },
    )
  } catch (error: unknown) {
    throwDrupalApiError(error, 'Failed to load profile values')
  }
})
