import { defineEventHandler } from 'h3'
import { drupalApiRequest, throwDrupalApiError } from '~~/server/utils/drupalApi'

type ProfileSchemaResponse = {
  fields?: Array<Record<string, unknown>>
}

export default defineEventHandler(async (event) => {
  try {
    return await drupalApiRequest<ProfileSchemaResponse>(
      event,
      '/api/account/profile/schema',
      {
        method: 'GET',
        forwardCookies: true,
      },
    )
  } catch (error: unknown) {
    throwDrupalApiError(error, 'Failed to load profile schema')
  }
})
