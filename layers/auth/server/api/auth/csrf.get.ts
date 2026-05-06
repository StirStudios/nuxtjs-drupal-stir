import { createError, defineEventHandler } from 'h3'
import {
  getForwardedCookie,
  getDrupalApiConfig,
} from '../../utils/drupalApi'
import { buildDrupalHeaders } from '../../utils/drupalHeaders'

export default defineEventHandler(async (event) => {
  const { baseUrl, apiKey } = getDrupalApiConfig()

  try {
    const csrfToken = await $fetch<string>(`${baseUrl}/session/token`, {
      headers: buildDrupalHeaders({
        cookie: getForwardedCookie(event),
        apiKey,
      }),
    })

    return { csrfToken }
  } catch {
    throw createError({
      statusCode: 502,
      statusMessage: 'Failed to fetch CSRF token',
    })
  }
})
