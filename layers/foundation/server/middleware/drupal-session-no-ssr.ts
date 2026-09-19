import {
  defineEventHandler,
  getRequestURL,
  parseCookies,
  } from 'h3'
import {
  getStirDrupalSessionCookieNames,
  isStirDrupalSessionCookieName,
  markStirPrivateResponse,
} from '../utils/stirDrupalApi'

// Cookie-authenticated HTML must never enter a shared response cache.
const SKIP_PATH = /^(?:\/__(?:\/|$)|\/_ipx(?:\/|$)|\/_nuxt(?:\/|$)|\/api(?:\/|$)|\/favicon)|\.(?:avif|css|gif|ico|jpe?g|js|json|map|png|svg|txt|webmanifest|webp|woff2?)$/i

export default defineEventHandler((event) => {
  if (event.method !== 'GET' && event.method !== 'HEAD') return

  if (SKIP_PATH.test(getRequestURL(event).pathname)) return

  const configuredNames = getStirDrupalSessionCookieNames()
  const hasDrupalSession = Object.keys(parseCookies(event)).some(cookieName =>
    isStirDrupalSessionCookieName(cookieName, configuredNames),
  )

  if (!hasDrupalSession) return

  event.context.nuxt ||= {}
  event.context.nuxt.noSSR = true

  markStirPrivateResponse(event)
})
