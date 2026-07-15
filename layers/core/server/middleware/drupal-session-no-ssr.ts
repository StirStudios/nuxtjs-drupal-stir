import {
  defineEventHandler,
  getRequestURL,
  parseCookies,
  setResponseHeader,
} from 'h3'
import {
  getStirDrupalSessionCookieNames,
  isStirDrupalSessionCookieName,
} from '../utils/stirDrupalApi'

const PRIVATE_NO_STORE = 'private, no-store, max-age=0'
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

  setResponseHeader(event, 'Cache-Control', PRIVATE_NO_STORE)
})
