import { getCookie, setCookie, type H3Event } from 'h3'
import { env } from 'node:process'
import {
  layerAuthCreateProtectedAccessToken,
  layerAuthVerifyProtectedAccessToken,
} from './protectedAccessToken'

export const LAYER_AUTH_PROTECTED_ACCESS_COOKIE_NAME = 'protected_access'
export const LAYER_AUTH_PROTECTED_ACCESS_MAX_AGE_SECONDS = 60 * 60 * 24 * 7

export const layerAuthGetProtectedAccessSecret = (): string => {
  const config = useRuntimeConfig()
  const explicitSecret = String(config.protectedCookieSecret || '').trim()

  if (explicitSecret.length) return explicitSecret

  return String(config.protectedPassword || '').trim()
}

export const layerAuthClearProtectedAccessCookie = (event: H3Event) => {
  setCookie(event, LAYER_AUTH_PROTECTED_ACCESS_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: env.NODE_ENV === 'production',
    maxAge: 0,
  })
}

export const layerAuthSetProtectedAccessCookie = (event: H3Event, secret: string) => {
  const token = layerAuthCreateProtectedAccessToken(secret, LAYER_AUTH_PROTECTED_ACCESS_MAX_AGE_SECONDS)

  setCookie(event, LAYER_AUTH_PROTECTED_ACCESS_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: env.NODE_ENV === 'production',
    maxAge: LAYER_AUTH_PROTECTED_ACCESS_MAX_AGE_SECONDS,
  })
}

export const layerAuthIsProtectedAccessAuthenticated = (
  event: H3Event,
  secret: string,
): boolean => {
  const token = getCookie(event, LAYER_AUTH_PROTECTED_ACCESS_COOKIE_NAME)

  return Boolean(token) && layerAuthVerifyProtectedAccessToken(token, secret)
}
