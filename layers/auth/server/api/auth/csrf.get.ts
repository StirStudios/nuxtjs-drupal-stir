import { createError, defineEventHandler } from 'h3'
import { layerAuthFetchDrupalCsrfToken } from '../../utils/drupalApi'

export default defineEventHandler(async (event) => {
  try {
    const csrfToken = await layerAuthFetchDrupalCsrfToken(event)

    return { csrfToken }
  } catch {
    throw createError({
      statusCode: 502,
      statusMessage: 'Failed to fetch CSRF token',
    })
  }
})
