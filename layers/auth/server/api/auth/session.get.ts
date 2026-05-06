import { defineEventHandler } from 'h3'
import {
  drupalApiRequest,
  throwDrupalApiError,
} from '~~/server/utils/drupalApi'
import {
  getProtectedAccessSecret,
  isProtectedAccessAuthenticated,
} from '~~/server/utils/protectedAccess'

type AuthSessionResponse = {
  authenticated?: boolean
  uid?: number
  name?: string
  mail?: string
  roles?: string[]
  user?: Record<string, unknown> | null
}

export default defineEventHandler(async (event) => {
  const secret = getProtectedAccessSecret()
  const protectedAuthenticated = secret
    ? isProtectedAccessAuthenticated(event, secret)
    : false

  try {
    const response = await drupalApiRequest<AuthSessionResponse>(
      event,
      '/api/auth/session',
      {
        method: 'GET',
        forwardCookies: true,
      },
    )

    return {
      authenticated: Boolean(response?.authenticated),
      protectedAuthenticated,
      user: response?.user ?? {
        uid: response?.uid ?? 0,
        name: response?.name ?? '',
        mail: response?.mail ?? '',
        roles: response?.roles ?? [],
      },
    }
  } catch (error: unknown) {
    const statusCode =
      typeof error === 'object' &&
      error !== null &&
      'statusCode' in error &&
      typeof (error as { statusCode?: unknown }).statusCode === 'number'
        ? (error as { statusCode: number }).statusCode
        : 500

    if (statusCode === 500) {
      return {
        authenticated: false,
        protectedAuthenticated,
        user: null,
      }
    }

    throwDrupalApiError(error, 'Session fetch failed')
  }
})
