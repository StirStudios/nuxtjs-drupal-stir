import { defineNuxtRouteMiddleware, navigateTo, useAppConfig } from '#app'
import { useAuthIntegration } from '../composables/auth/useAuthIntegration'

const ACCOUNT_AUTH_ROUTES = new Set([
  '/auth/login',
  '/auth/register',
  '/auth/password/request',
  '/auth/password/reset',
  '/auth/verify',
])

function isAccountRoute(path: string): boolean {
  return path === '/account' || path.startsWith('/account/')
}

export default defineNuxtRouteMiddleware((to) => {
  const integrationEnabled = useAuthIntegration()

  if (integrationEnabled) return
  if (!isAccountRoute(to.path) && !ACCOUNT_AUTH_ROUTES.has(to.path)) return

  return navigateTo(useAppConfig().protectedRoutes?.fallbackRedirectPath || '/')
})
