import {
  createError,
  defineEventHandler,
  getRequestURL,
  parseCookies,
  setResponseHeader,
} from 'h3'
import {
  getStirDrupalSessionCookieNames,
  isStirDrupalSessionCookieName,
} from '../../../foundation/server/utils/stirDrupalApi'
import {
  layerAuthGetProtectedAccessSecret,
  layerAuthIsProtectedAccessAuthenticated,
} from '../utils/protectedAccess'
import {
  isStirProtectedPath,
  normalizeStirProtectedPaths,
} from '../../shared/utils/protectedPaths'

// The page proxy serves the content behind a protected route. Gating only the
// Vue route would leave that payload fetchable directly, so the same policy is
// applied at the server boundary.
const CE_PROXY_PREFIX = '/api/drupal-ce'
const PRIVATE_NO_STORE = 'private, no-store, max-age=0'

type StirProtectedRoutesConfig = {
  requireLoginPaths?: unknown
  allowAuthenticatedUserBypass?: unknown
}

const protectedRoutePathFor = (requestPath: string): string | undefined => {
  if (requestPath === CE_PROXY_PREFIX) return '/'
  if (!requestPath.startsWith(`${CE_PROXY_PREFIX}/`)) return undefined

  const routePath = requestPath.slice(CE_PROXY_PREFIX.length)

  return routePath.startsWith('/') ? routePath : `/${routePath}`
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig() as Record<string, unknown>
  const protectedRoutes = (config.stirProtectedRoutes
    && typeof config.stirProtectedRoutes === 'object'
    ? config.stirProtectedRoutes
    : {}) as StirProtectedRoutesConfig
  const protectedPaths = normalizeStirProtectedPaths(
    protectedRoutes.requireLoginPaths,
  )

  if (protectedPaths.length === 0) return

  const routePath = protectedRoutePathFor(getRequestURL(event).pathname)

  if (!routePath || !isStirProtectedPath(routePath, protectedPaths)) return

  setResponseHeader(event, 'Cache-Control', PRIVATE_NO_STORE)

  const secret = layerAuthGetProtectedAccessSecret()

  if (secret && await layerAuthIsProtectedAccessAuthenticated(event, secret)) {
    return
  }

  if (protectedRoutes.allowAuthenticatedUserBypass !== false) {
    const configuredNames = getStirDrupalSessionCookieNames()
    const hasDrupalSession = Object.keys(parseCookies(event)).some(cookieName =>
      isStirDrupalSessionCookieName(cookieName, configuredNames),
    )

    // A Drupal session only bypasses the gate as far as Drupal allows; the
    // proxied request still carries that session and Drupal enforces its own
    // access on the content.
    if (hasDrupalSession) return
  }

  throw createError({
    statusCode: 403,
    statusMessage: 'Protected content requires access',
  })
})
