import type { AuthSessionResponse, AuthSessionUser } from '../../types/auth'
import { useAuthIntegration } from './useAuthIntegration'

type FetchSessionOptions = {
  force?: boolean
}

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
  const integrationEnabled = useAuthIntegration()
  const requestFetch = useRequestFetch()
  const { error, execute } = useAsyncData(
    'stir-auth-session',
    async () => {
      const session = await requestFetch<AuthSessionResponse>('/api/auth/session')

      loggedIn.value = Boolean(session?.authenticated)
      protectedLoggedIn.value = Boolean(session?.protectedAuthenticated)
      user.value = session?.user ?? null
      ready.value = true

      return session
    },
    {
      default: () => null,
      immediate: false,
      dedupe: 'defer',
    },
  )

  const fetchSession = async (options: FetchSessionOptions = {}) => {
    if (!integrationEnabled) {
      clearSession()
      return
    }

    if (ready.value && !options.force) return

    await execute({ dedupe: 'defer' })

    if (error.value) {
      throw error.value
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
