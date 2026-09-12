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
import { layerAuthDrupalApiRequest } from '../utils/drupalApi'
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

  // Mirrors normalizeProxyPath()'s leading-slash collapse in drupalCeProxy.ts:
  // the two must agree on the canonical path, or a request such as
  // /api/drupal-ce//private/report evades this prefix match while still
  // reaching the protected Drupal path once the proxy normalizes it.
  return requestPath.slice(CE_PROXY_PREFIX.length).replace(/^\/+/, '/')
}

type DrupalSessionResponse = { authenticated?: boolean }

const isAuthenticatedDrupalSession = async (event: unknown): Promise<boolean> => {
  try {
    const response = await layerAuthDrupalApiRequest<DrupalSessionResponse>(
      event,
      '/api/auth/session',
      { method: 'GET', forwardCookies: true },
    )

    return Boolean(response?.authenticated)
  } catch {
    return false
  }
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
    const hasDrupalSessionCookie = Object.keys(parseCookies(event)).some(cookieName =>
      isStirDrupalSessionCookieName(cookieName, configuredNames),
    )

    // The cookie name alone proves nothing: this gate exists specifically for
    // content Drupal still serves anonymously, so a forged cookie of the
    // right shape would otherwise bypass it for free. Confirm Drupal actually
    // authenticates the session before granting the bypass.
    if (hasDrupalSessionCookie && await isAuthenticatedDrupalSession(event)) {
      return
    }
  }

  throw createError({
    statusCode: 403,
    statusMessage: 'Protected content requires access',
  })
})
