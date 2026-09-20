import { useAuthConfig } from '../composables/useAuthConfig'
import type { AuthSessionResponse } from '../types/auth'
import { GUEST_ONLY_AUTH_PATHS } from '../utils/authRoutes'

export default defineNuxtRouteMiddleware(async (to) => {
  if (!GUEST_ONLY_AUTH_PATHS.has(to.path)) return

  const { accountsEnabled, auth, ensureLoaded } = useAuthConfig()

  await ensureLoaded()
  if (!accountsEnabled.value) return

  const redirectPath = auth.value.loginRedirectPath || '/'
  // Guest-only routes must use the current request as their source of truth.
  // Reusing hydrated auth state here can redirect an anonymous navigation after
  // another session was authenticated, particularly across SSR/SPA boundaries.
  const requestFetch = useRequestFetch()
  const session = await requestFetch<AuthSessionResponse>('/api/auth/session')

  if (session?.authenticated) {
    return navigateTo(redirectPath)
  }

  if (to.path === '/auth/register') {
    const policy = await requestFetch<{ allowed?: boolean }>(
      '/api/auth/register-policy',
    )

    if (!policy?.allowed) {
      return navigateTo('/auth/login')
    }
  }
})
