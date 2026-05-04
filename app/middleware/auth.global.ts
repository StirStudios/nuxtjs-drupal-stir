import { defineNuxtRouteMiddleware, navigateTo, useAppConfig } from '#app'
import { useAuthSession } from '~/composables/auth/useAuthSession'

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
  const protectedLoginPath = config.loginPath || '/auth/protected'
  const redirectOnLogin = config.redirectOnLogin || '/'
  const session = useAuthSession()

  if (to.path === protectedLoginPath) {
    if (!session.ready.value) {
      await session.fetchSession()
    }

    if (session.protectedLoggedIn.value) {
      return navigateTo(redirectOnLogin)
    }
  }

  if (!protectedPaths.length) return

  const isProtected = protectedPaths.some((path: string) =>
    matchesProtectedPath(to.path, path),
  )

  if (!isProtected) return

  if (!session.ready.value) {
    await session.fetchSession()
  }

  if (!session.loggedIn.value && !session.protectedLoggedIn.value) {
    return navigateTo({
      path: protectedLoginPath,
      query: {
        ...to.query,
        redirect: to.fullPath,
      },
    })
  }
})
