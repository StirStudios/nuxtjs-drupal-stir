import { useAuthConfig } from '../composables/auth/useAuthConfig'
import type { AuthSessionResponse } from '../types/auth'

const GUEST_ONLY_AUTH_ROUTES = new Set([
  '/auth/login',
  '/auth/register',
  '/auth/password/request',
  '/auth/password/reset',
])

export default defineNuxtRouteMiddleware(async (to) => {
  if (!GUEST_ONLY_AUTH_ROUTES.has(to.path)) return

  const { auth, ensureLoaded, integrationEnabled } = useAuthConfig()

  if (!integrationEnabled) return

  await ensureLoaded()

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
