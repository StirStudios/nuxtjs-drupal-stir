import { getCookie, getHeader, setCookie, type H3Event } from 'h3'
import {
  createProtectedAccessToken,
  verifyProtectedAccessToken,
} from './protectedAccessToken'

export const PROTECTED_ACCESS_COOKIE_NAME = 'protected_access'
export const PROTECTED_ACCESS_MAX_AGE_SECONDS = 60 * 60 * 24 * 7

const getCookieSecureFlag = (event: H3Event): boolean => {
  if (!import.meta.dev) return true

  const forwardedProto = getHeader(event, 'x-forwarded-proto')
  const forwardedProtoValue = Array.isArray(forwardedProto)
    ? forwardedProto[0]
    : forwardedProto

  if (typeof forwardedProtoValue === 'string') {
    const proto = forwardedProtoValue
      .split(',')
      .at(0)
      ?.trim()
      .toLowerCase()

    if (proto === 'https') return true
  }

  const origin = getHeader(event, 'origin')

  if (typeof origin === 'string' && origin.startsWith('https://')) return true

  const referer = getHeader(event, 'referer')

  if (typeof referer === 'string' && referer.startsWith('https://')) return true

  const socket = event.node?.req?.socket as unknown

  if (
    typeof socket === 'object'
    && socket !== null
    && 'encrypted' in socket
    && typeof socket.encrypted === 'boolean'
  ) {
    return socket.encrypted
  }

  return false
}


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
    secure: getCookieSecureFlag(event),
    maxAge: 0,
  })
}


export const setProtectedAccessCookie = async (
  event: H3Event,
  secret: string,
) => {
  const token = await createProtectedAccessToken(
    secret,
    PROTECTED_ACCESS_MAX_AGE_SECONDS,
  )

  setCookie(event, PROTECTED_ACCESS_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: getCookieSecureFlag(event),
    maxAge: PROTECTED_ACCESS_MAX_AGE_SECONDS,
  })
}


export const isProtectedAccessAuthenticated = (
  event: H3Event,
  secret: string,
): Promise<boolean> => {
  const token = getCookie(event, PROTECTED_ACCESS_COOKIE_NAME)

  return token ? verifyProtectedAccessToken(token, secret) : Promise.resolve(false)
}
