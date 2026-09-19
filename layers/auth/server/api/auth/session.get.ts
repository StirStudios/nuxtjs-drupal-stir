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
  user?: Record<string, unknown> | null
  signed_out_reason?: string
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

    // Kept out of the user object: it describes this browser, not the account.
    const { authenticated, user, signed_out_reason: signedOutReason, ...account } = response || {}

    return {
      authenticated: Boolean(response?.authenticated),
      protectedAuthenticated,
      ...(signedOutReason === 'session_limit' ? { signedOutReason } : {}),
      user: user ?? {
        ...account,
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

    throwStirDrupalApiError(error, 'Session fetch failed')
  }
})
