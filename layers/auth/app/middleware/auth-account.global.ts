import { useAuthConfig } from '../composables/useAuthConfig'
import { ACCOUNT_AUTH_PATHS } from '../utils/authRoutes'

function isAccountRoute(path: string): boolean {
  return path === '/account' || path.startsWith('/account/')
}

export default defineNuxtRouteMiddleware(async (to) => {
  if (!isAccountRoute(to.path) && !ACCOUNT_AUTH_PATHS.has(to.path)) return

  const { accountsEnabled, ensureLoaded } = useAuthConfig()

  await ensureLoaded()

  if (accountsEnabled.value) return

  return navigateTo(useAppConfig().protectedRoutes?.fallbackRedirectPath || '/')
})
