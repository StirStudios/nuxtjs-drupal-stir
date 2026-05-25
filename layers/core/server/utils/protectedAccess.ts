import { getCookie, setCookie, type H3Event } from 'h3'
import { env } from 'node:process'
import {
  createProtectedAccessToken,
  verifyProtectedAccessToken,
} from './protectedAccessToken'

export const PROTECTED_ACCESS_COOKIE_NAME = 'protected_access'
export const PROTECTED_ACCESS_MAX_AGE_SECONDS = 60 * 60 * 24 * 7

export const getProtectedAccessSecret = (): string => {
  const config = useRuntimeConfig()
  const explicitSecret = String(config.protectedCookieSecret || '').trim()

  if (explicitSecret.length) return explicitSecret

  return String(config.protectedPassword || '').trim()
}

export const clearProtectedAccessCookie = (event: H3Event) => {
  setCookie(event, PROTECTED_ACCESS_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: env.NODE_ENV === 'production',
    maxAge: 0,
  })
}

export const setProtectedAccessCookie = (event: H3Event, secret: string) => {
  const token = createProtectedAccessToken(secret, PROTECTED_ACCESS_MAX_AGE_SECONDS)

  setCookie(event, PROTECTED_ACCESS_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: env.NODE_ENV === 'production',
    maxAge: PROTECTED_ACCESS_MAX_AGE_SECONDS,
  })
}

export const isProtectedAccessAuthenticated = (
  event: H3Event,
  secret: string,
): boolean => {
  const token = getCookie(event, PROTECTED_ACCESS_COOKIE_NAME)

  return Boolean(token) && verifyProtectedAccessToken(token, secret)
}
