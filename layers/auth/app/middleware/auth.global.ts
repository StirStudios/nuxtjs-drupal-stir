import { useAuthConfig } from '../composables/auth/useAuthConfig'
import { useAuthSession } from '../composables/auth/useAuthSession'
import { useProtectedSession } from '../composables/auth/useProtectedSession'

const PRIVATE_NO_STORE = 'private, no-store, max-age=0'

function markPrivateResponse(): void {
  if (import.meta.server) {
    useResponseHeader('Cache-Control').value = PRIVATE_NO_STORE
  }
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

  const protectedPaths = normalizeStirProtectedPaths(config.requireLoginPaths)

  if (!protectedPaths.length) return

  const protectedLoginPath = config.loginPath || '/auth/protected'

  if (isAuthSystemRoute(to.path, protectedLoginPath)) {
    markPrivateResponse()
    return
  }

  const isProtected = isStirProtectedPath(to.path, protectedPaths)

  if (!isProtected) return

  markPrivateResponse()

  let allowAuthenticatedUserBypass = false

  if (config.allowAuthenticatedUserBypass !== false) {
    const authConfig = useAuthConfig()

    await authConfig.ensureLoaded()
    allowAuthenticatedUserBypass = authConfig.accountsEnabled.value
  }
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
