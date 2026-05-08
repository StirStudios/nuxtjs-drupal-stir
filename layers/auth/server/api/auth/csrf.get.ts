import { createError, defineEventHandler } from 'h3'
import {
  layerAuthGetForwardedCookie,
  layerAuthGetDrupalApiConfig,
} from '../../utils/drupalApi'
import { layerAuthBuildDrupalHeaders } from '../../utils/drupalHeaders'

export default defineEventHandler(async (event) => {
  const { baseUrl, apiKey } = layerAuthGetDrupalApiConfig()

  try {
    const csrfToken = await $fetch<string>(`${baseUrl}/session/token`, {
      headers: layerAuthBuildDrupalHeaders({
        cookie: layerAuthGetForwardedCookie(event),
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
