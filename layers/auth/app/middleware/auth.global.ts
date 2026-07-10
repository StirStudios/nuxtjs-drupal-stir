import { defineNuxtRouteMiddleware, navigateTo, useAppConfig } from '#app'
import { useAuthIntegration } from '../composables/auth/useAuthIntegration'
import { useAuthSession } from '../composables/auth/useAuthSession'
import { useProtectedSession } from '../composables/auth/useProtectedSession'

function matchesProtectedPath(routePath: string, rule: string): boolean {
  const normalizedRule = rule.trim()

  if (!normalizedRule) return false
  if (normalizedRule === '/') return routePath === '/'
  if (normalizedRule.endsWith('/')) return routePath.startsWith(normalizedRule)
  return routePath === normalizedRule
}

function isAuthSystemRoute(path: string, protectedLoginPath: string): boolean {
  if (path === protectedLoginPath) return true

  return (
    path === '/auth/login' ||
    path === '/auth/logout' ||
    path === '/auth/verify' ||
    path === '/auth/register' ||
    path === '/auth/password/request' ||
    path === '/auth/password/reset'
  )
}

export default defineNuxtRouteMiddleware(async (to) => {
  const config = useAppConfig().protectedRoutes

  if (!config) return

  const protectedPaths = (config.requireLoginPaths ?? []).filter(
    (path): path is string =>
      typeof path === 'string' && path.trim().length > 0,
  )

  if (!protectedPaths.length) return

  const protectedLoginPath = config.loginPath || '/auth/protected'

  if (isAuthSystemRoute(to.path, protectedLoginPath)) return

  const isProtected = protectedPaths.some((path: string) =>
    matchesProtectedPath(to.path, path),
  )

  if (!isProtected) return

  const integrationEnabled = useAuthIntegration()
  const allowAuthenticatedUserBypass =
    integrationEnabled && config.allowAuthenticatedUserBypass !== false
  const protectedSession = useProtectedSession()

  await protectedSession.fetchSession()

  let hasProtectedAccess = protectedSession.loggedIn.value

  if (allowAuthenticatedUserBypass && !hasProtectedAccess) {
    const session = useAuthSession()

    await session.fetchSession()
    hasProtectedAccess = session.loggedIn.value
  }

  if (!hasProtectedAccess) {
    return navigateTo({
      path: protectedLoginPath,
      query: {
        redirect: to.fullPath,
      },
    })
  }
})
