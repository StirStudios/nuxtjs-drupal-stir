import { getCookie, getHeader, setCookie, type H3Event } from 'h3'
import {
  layerAuthCreateProtectedAccessToken,
  layerAuthVerifyProtectedAccessToken,
} from './protectedAccessToken'

export const LAYER_AUTH_PROTECTED_ACCESS_COOKIE_NAME = 'protected_access'
export const LAYER_AUTH_PROTECTED_ACCESS_MAX_AGE_SECONDS = 60 * 60 * 24 * 7

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


export const layerAuthGetProtectedAccessSecret = (): string => {
  const config = useRuntimeConfig()
  const explicitSecret = String(config.protectedCookieSecret || '').trim()
  const password = String(config.protectedPassword || '')

  if (!password) return ''
  if (explicitSecret) return `${explicitSecret}\u0000${password}`

  return import.meta.dev ? password : ''
}


export const layerAuthClearProtectedAccessCookie = (event: H3Event) => {
  setCookie(event, LAYER_AUTH_PROTECTED_ACCESS_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: getCookieSecureFlag(event),
    maxAge: 0,
  })
}


export const layerAuthSetProtectedAccessCookie = async (
  event: H3Event,
  secret: string,
) => {
  const token = await layerAuthCreateProtectedAccessToken(
    secret,
    LAYER_AUTH_PROTECTED_ACCESS_MAX_AGE_SECONDS,
  )

  setCookie(event, LAYER_AUTH_PROTECTED_ACCESS_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: getCookieSecureFlag(event),
    maxAge: LAYER_AUTH_PROTECTED_ACCESS_MAX_AGE_SECONDS,
  })
}


export const layerAuthIsProtectedAccessAuthenticated = (
  event: H3Event,
  secret: string,
): Promise<boolean> => {
  const token = getCookie(event, LAYER_AUTH_PROTECTED_ACCESS_COOKIE_NAME)

  return token
    ? layerAuthVerifyProtectedAccessToken(token, secret)
    : Promise.resolve(false)
}
