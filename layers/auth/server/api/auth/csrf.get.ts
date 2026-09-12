import { createError, defineEventHandler } from 'h3'
import { fetchStirDrupalCsrfToken } from '../../../../foundation/server/utils/stirDrupalApi'

export default defineEventHandler(async (event) => {
  try {
    const csrfToken = await fetchStirDrupalCsrfToken(event)

    return { csrfToken }
  } catch {
    throw createError({
      statusCode: 502,
      statusMessage: 'Failed to fetch CSRF token',
    })
  }
})
