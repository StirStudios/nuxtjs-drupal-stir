import {
  createError,
  defineEventHandler,
  getCookie,
  readBody,
} from 'h3'
import {
  LAYER_AUTH_PROTECTED_ACCESS_COOKIE_NAME,
  layerAuthClearProtectedAccessCookie,
  layerAuthGetProtectedAccessSecret,
  layerAuthIsProtectedAccessAuthenticated,
  layerAuthSetProtectedAccessCookie,
} from '../../utils/protectedAccess'
import { layerAuthConstantTimeEquals } from '../../utils/protectedAccessToken'
import {
  layerAuthCheckProtectedLoginRateLimit,
  layerAuthRecordProtectedLoginFailure,
  layerAuthResetProtectedLoginRateLimit,
} from '../../utils/protectedRateLimit'
import { assertStirSameOrigin } from '../../../../foundation/server/utils/stirRequestSecurity'

type ProtectedBody = {
  action?: unknown
  password?: unknown
  turnstile_response?: unknown
}

export default defineEventHandler(async (event) => {
  assertStirSameOrigin(event)

  const body = await readBody<ProtectedBody>(event)
  const action =
    typeof body?.action === 'string' ? body.action.toLowerCase().trim() : ''

  if (action === 'logout') {
    layerAuthClearProtectedAccessCookie(event)

    return { protectedAuthenticated: false }
  }

  const rateLimit = await layerAuthCheckProtectedLoginRateLimit(event)

  if (!rateLimit.allowed) {
    event.node.res.setHeader(
      'Retry-After',
      String(rateLimit.retryAfterSeconds),
    )

    throw createError({
      statusCode: 429,
      statusMessage: 'Too many attempts. Please try again later',
    })
  }

  const turnstileResponse =
    typeof body?.turnstile_response === 'string'
      ? body.turnstile_response.trim()
      : ''

  if (!turnstileResponse) {
    await layerAuthRecordProtectedLoginFailure(event)

    throw createError({
      statusCode: 422,
      statusMessage: 'Security challenge is required',
    })
  }

  const turnstileValidation = await verifyTurnstileToken(turnstileResponse, event)

  if (!turnstileValidation.success) {
    await layerAuthRecordProtectedLoginFailure(event)

    throw createError({
      statusCode: 403,
      statusMessage: 'Security challenge failed',
    })
  }

  const submittedPassword = typeof body?.password === 'string' ? body.password : ''
  const expectedPassword = String(useRuntimeConfig().protectedPassword || '')

  if (
    !submittedPassword ||
    !expectedPassword ||
    !layerAuthConstantTimeEquals(submittedPassword, expectedPassword)
  ) {
    const protectedAccessCookie = getCookie(
      event,
      LAYER_AUTH_PROTECTED_ACCESS_COOKIE_NAME,
    )

    if (
      protectedAccessCookie
      && (
        !expectedPassword
        || !await layerAuthIsProtectedAccessAuthenticated(event, expectedPassword)
      )
    ) {
      layerAuthClearProtectedAccessCookie(event)
    }

    await layerAuthRecordProtectedLoginFailure(event)

    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid password',
    })
  }

  const secret = layerAuthGetProtectedAccessSecret()

  await layerAuthSetProtectedAccessCookie(event, secret)
  await layerAuthResetProtectedLoginRateLimit(event)

  return {
    protectedAuthenticated: true,
  }
})
