import { defineNuxtRouteMiddleware, navigateTo, useAppConfig } from '#app'
import { useAuthSession } from '~/composables/auth/useAuthSession'

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

  const session = useAuthSession()

  await session.fetchSession()

  const allowAuthenticatedUserBypass =
    config.allowAuthenticatedUserBypass !== false
  const hasProtectedAccess = allowAuthenticatedUserBypass
    ? session.loggedIn.value || session.protectedLoggedIn.value
    : session.protectedLoggedIn.value

  if (!hasProtectedAccess) {
    return navigateTo({
      path: protectedLoginPath,
      query: {
        redirect: to.fullPath,
      },
    })
  }
})
