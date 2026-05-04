import {
  createError,
  defineEventHandler,
  getCookie,
  readBody,
  setCookie,
} from 'h3'

type ProtectedBody = {
  action?: unknown
  password?: unknown
}

export default defineEventHandler(async (event) => {
  const body = await readBody<ProtectedBody>(event)
  const action =
    typeof body?.action === 'string' ? body.action.toLowerCase().trim() : ''

  if (action === 'logout') {
    setCookie(event, 'protected_access', '', {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 0,
    })

    return { protectedAuthenticated: false }
  }

  const submittedPassword =
    typeof body?.password === 'string' ? body.password.trim() : ''
  const expectedPassword = String(useRuntimeConfig().protectedPassword || '')

  if (!submittedPassword || !expectedPassword || submittedPassword !== expectedPassword) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid password',
    })
  }

  setCookie(event, 'protected_access', '1', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7,
  })

  const protectedCookie = getCookie(event, 'protected_access')

  return {
    protectedAuthenticated: protectedCookie === '1',
  }
})
