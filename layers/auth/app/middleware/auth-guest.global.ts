import { defineNuxtRouteMiddleware, navigateTo } from '#app'
import { useAuthConfig } from '../composables/auth/useAuthConfig'
import { useAuthSession } from '../composables/auth/useAuthSession'

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
  const session = useAuthSession()

  await session.fetchSession()

  if (session.loggedIn.value) {
    return navigateTo(redirectPath)
  }

  if (to.path === '/auth/register') {
    const requestFetch = useRequestFetch()
    const policy = await requestFetch<{ allowed?: boolean }>(
      '/api/auth/register-policy',
    )

    if (!policy?.allowed) {
      return navigateTo('/auth/login')
    }
  }
})
