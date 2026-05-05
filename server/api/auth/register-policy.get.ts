import { defineEventHandler } from 'h3'
import { getDrupalApiConfig, getForwardedCookie } from '../../utils/drupalApi'
import { buildDrupalHeaders } from '../../utils/drupalHeaders'

type RegisterPolicyResponse = {
  allowed: boolean
}

export default defineEventHandler(async (event): Promise<RegisterPolicyResponse> => {
  const { baseUrl, apiKey } = getDrupalApiConfig()
  const registerUrl = `${baseUrl}/user/register`

  try {
    const response = await $fetch.raw<string>(registerUrl, {
      method: 'GET',
      headers: buildDrupalHeaders({
        apiKey,
        cookie: getForwardedCookie(event),
      }),
      redirect: 'manual',
    })

    return {
      allowed: response.status >= 200 && response.status < 300,
    }
  } catch (error: unknown) {
    const statusCode =
      typeof error === 'object' &&
      error !== null &&
      'statusCode' in error &&
      typeof (error as { statusCode?: unknown }).statusCode === 'number'
        ? (error as { statusCode: number }).statusCode
        : 500

    if (statusCode === 401 || statusCode === 403 || statusCode === 404) {
      return { allowed: false }
    }

    return { allowed: false }
  }
})
