import { createError, defineEventHandler, readBody } from 'h3'
import {
  layerAuthClearProtectedAccessCookie,
  layerAuthGetProtectedAccessSecret,
  layerAuthIsProtectedAccessAuthenticated,
  layerAuthSetProtectedAccessCookie,
} from '../../utils/protectedAccess'

type ProtectedBody = {
  action?: unknown
  password?: unknown
}

export default defineEventHandler(async (event) => {
  const body = await readBody<ProtectedBody>(event)
  const action =
    typeof body?.action === 'string' ? body.action.toLowerCase().trim() : ''

  if (action === 'logout') {
    layerAuthClearProtectedAccessCookie(event)

    return { protectedAuthenticated: false }
  }

  const submittedPassword =
    typeof body?.password === 'string' ? body.password.trim() : ''
  const expectedPassword = String(useRuntimeConfig().protectedPassword || '')

  if (
    !submittedPassword ||
    !expectedPassword ||
    submittedPassword !== expectedPassword
  ) {
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

  return {
    protectedAuthenticated: await layerAuthIsProtectedAccessAuthenticated(event, secret),
  }
})
