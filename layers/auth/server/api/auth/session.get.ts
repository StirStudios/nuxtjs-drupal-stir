import { defineEventHandler } from 'h3'
import {
  layerAuthDrupalApiRequest,
  layerAuthThrowDrupalApiError,
} from '../../utils/drupalApi'
import {
  layerAuthGetProtectedAccessSecret,
  layerAuthIsProtectedAccessAuthenticated,
} from '../../utils/protectedAccess'

type AuthSessionResponse = {
  authenticated?: boolean
  uid?: number
  name?: string
  mail?: string
  roles?: string[]
  user?: Record<string, unknown> | null
}

export default defineEventHandler(async (event) => {
  const secret = layerAuthGetProtectedAccessSecret()
  const protectedAuthenticated = secret
    ? await layerAuthIsProtectedAccessAuthenticated(event, secret)
    : false

  try {
    const response = await layerAuthDrupalApiRequest<AuthSessionResponse>(
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

    layerAuthThrowDrupalApiError(error, 'Session fetch failed')
  }
})
