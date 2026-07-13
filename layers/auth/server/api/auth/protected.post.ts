import {
  createError,
  defineEventHandler,
  readBody,
  setResponseHeader,
} from 'h3'
import {
  layerAuthClearProtectedAccessCookie,
  layerAuthGetProtectedAccessSecret,
  layerAuthSetProtectedAccessCookie,
} from '../../utils/protectedAccess'
import { layerAuthConstantTimeEquals } from '../../utils/protectedAccessToken'
import {
  layerAuthCheckProtectedLoginRateLimit,
  layerAuthRecordProtectedLoginFailure,
  layerAuthResetProtectedLoginRateLimit,
} from '../../utils/protectedRateLimit'

type ProtectedBody = {
  action?: unknown
  password?: unknown
  turnstile_response?: unknown
}

export default defineEventHandler(async (event) => {
  const body = await readBody<ProtectedBody>(event)
  const action =
    typeof body?.action === 'string' ? body.action.toLowerCase().trim() : ''

  if (action === 'logout') {
    layerAuthClearProtectedAccessCookie(event)

    return { protectedAuthenticated: false }
  }

  const rateLimit = await layerAuthCheckProtectedLoginRateLimit(event)

  if (!rateLimit.allowed) {
    setResponseHeader(event, 'Retry-After', rateLimit.retryAfterSeconds)

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
    await layerAuthRecordProtectedLoginFailure(event)

    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid password',
    })
  }

  const secret = layerAuthGetProtectedAccessSecret()

  if (!secret) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Protected cookie secret is not configured',
    })
  }

  await layerAuthSetProtectedAccessCookie(event, secret)
  await layerAuthResetProtectedLoginRateLimit(event)

  return {
    protectedAuthenticated: true,
  }
})
