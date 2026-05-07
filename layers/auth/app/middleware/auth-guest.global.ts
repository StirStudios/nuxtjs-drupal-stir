import { defineNuxtRouteMiddleware, navigateTo, useAppConfig } from '#app'
import { useAuthSession } from '../composables/auth/useAuthSession'

const GUEST_ONLY_AUTH_ROUTES = new Set([
  '/auth/login',
  '/auth/register',
  '/auth/password/request',
  '/auth/password/reset',
])

export default defineNuxtRouteMiddleware(async (to) => {
  if (!GUEST_ONLY_AUTH_ROUTES.has(to.path)) return

  const appConfig = useAppConfig()
  const redirectPath = appConfig.auth?.loginRedirectPath || '/'
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
