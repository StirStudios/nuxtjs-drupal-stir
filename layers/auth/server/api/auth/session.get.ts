import { defineEventHandler } from 'h3'
import { layerAuthDrupalApiRequest } from '../../utils/drupalApi'
import {
  layerAuthGetProtectedAccessSecret,
  layerAuthIsProtectedAccessAuthenticated,
} from '../../utils/protectedAccess'
import { throwStirDrupalApiError } from '../../../../foundation/server/utils/stirDrupalApi'

type AuthSessionResponse = {
  authenticated?: boolean
  uid?: number
  name?: string
  mail?: string
  roles?: string[]
  csrf_token?: string
  logout_token?: string
} & Record<string, unknown>

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

    // Drupal's CSRF and logout tokens stay server-side; projects may still
    // extend the snapshot with their own fields.
    const {
      authenticated,
      csrf_token: _csrfToken,
      logout_token: _logoutToken,
      ...account
    } = response ?? {}

    return {
      authenticated: Boolean(authenticated),
      protectedAuthenticated,
      user: {
        ...account,
        uid: account.uid ?? 0,
        name: account.name ?? '',
        mail: account.mail ?? '',
        roles: account.roles ?? [],
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

    throwStirDrupalApiError(error, 'Session fetch failed')
  }
})
