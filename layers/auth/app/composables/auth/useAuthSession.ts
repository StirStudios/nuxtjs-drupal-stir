import type { AuthSessionResponse, AuthSessionUser } from '../../types/auth'
import { useAuthConfig } from './useAuthConfig'

export function useAuthSession() {
  const ready = useState<boolean>('auth-session-ready', () => false)
  const loggedIn = useState<boolean>('auth-session-logged-in', () => false)
  const protectedLoggedIn = useState<boolean>(
    'auth-session-protected-logged-in',
    () => false,
  )
  const user = useState<AuthSessionUser | null>(
    'auth-session-user',
    () => null,
  )
  let pendingSessionFetch: Promise<void> | null = null
  const { integrationEnabled } = useAuthConfig()

  const fetchSession = async () => {
    if (!integrationEnabled) {
      ready.value = true
      loggedIn.value = false
      user.value = null
      return
    }

    if (pendingSessionFetch) {
      await pendingSessionFetch
      return
    }

    const requestFetch = useRequestFetch()

    pendingSessionFetch = (async () => {
      const session = await requestFetch<AuthSessionResponse>('/api/auth/session')

      loggedIn.value = Boolean(session?.authenticated)
      protectedLoggedIn.value = Boolean(session?.protectedAuthenticated)
      user.value = session?.user ?? null
      ready.value = true
    })()

    try {
      await pendingSessionFetch
    } finally {
      pendingSessionFetch = null
    }
  }

  const clearSession = () => {
    ready.value = true
    loggedIn.value = false
    protectedLoggedIn.value = false
    user.value = null
  }

  return {
    ready,
    loggedIn,
    protectedLoggedIn,
    user,
    fetchSession,
    clearSession,
  }
}
