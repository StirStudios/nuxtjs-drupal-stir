import { defineNuxtRouteMiddleware, navigateTo, useAppConfig } from '#imports'

function matchesProtectedPath(routePath: string, rule: string): boolean {
  const normalizedRule = rule.trim()

  if (!normalizedRule) return false
  if (normalizedRule === '/') return routePath === '/'
  if (normalizedRule.endsWith('/')) return routePath.startsWith(normalizedRule)
  return routePath === normalizedRule
}

export default defineNuxtRouteMiddleware(async (to) => {
  const config = useAppConfig().protectedRoutes

  if (!config) return

  const protectedPaths = (config.requireLoginPaths ?? []).filter(
    (path): path is string =>
      typeof path === 'string' && path.trim().length > 0,
  )
  const loginPath = config.loginPath || '/login'
  const redirectOnLogin = config.redirectOnLogin || '/'
  const session =
    typeof useUserSession === 'function' ? useUserSession() : undefined

  if (to.path === loginPath && session) {
    if (!session.ready.value) {
      await session.fetch()
    }

    if (session.loggedIn.value) {
      return navigateTo(redirectOnLogin)
    }
  }

  if (!protectedPaths.length) return

  const isProtected = protectedPaths.some((path: string) =>
    matchesProtectedPath(to.path, path),
  )

  if (!isProtected) return

  if (!session) {
    return navigateTo({
      path: loginPath,
      query: to.query,
    })
  }

  if (!session.ready.value) {
    await session.fetch()
  }

  if (!session.loggedIn.value) {
    return navigateTo({
      path: loginPath,
      query: to.query,
    })
  }
})
