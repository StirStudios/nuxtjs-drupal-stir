import { createError, defineEventHandler, readBody } from 'h3'
import {
  clearProtectedAccessCookie,
  getProtectedAccessSecret,
  isProtectedAccessAuthenticated,
  setProtectedAccessCookie,
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
    clearProtectedAccessCookie(event)

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

  const secret = getProtectedAccessSecret()

  if (!secret) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Protected cookie secret is not configured',
    })
  }

  setProtectedAccessCookie(event, secret)

  return {
    protectedAuthenticated: isProtectedAccessAuthenticated(event, secret),
  }
})
