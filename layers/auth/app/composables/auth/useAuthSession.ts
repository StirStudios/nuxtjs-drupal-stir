import type { AuthSessionResponse, AuthSessionUser } from '../../types/auth'

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

  const fetchSession = async () => {
    const requestFetch = useRequestFetch()
    const session = await requestFetch<AuthSessionResponse>('/api/auth/session')

    loggedIn.value = Boolean(session?.authenticated)
    protectedLoggedIn.value = Boolean(session?.protectedAuthenticated)
    user.value = session?.user ?? null
    ready.value = true
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
