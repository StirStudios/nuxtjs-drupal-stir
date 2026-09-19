type FetchProtectedSessionOptions = {
  force?: boolean
}

type ProtectedSessionResponse = {
  protectedAuthenticated?: boolean
}

export function useProtectedSession() {
  const ready = useState<boolean>('auth-protected-session-ready', () => false)
  // Shared with useAuthSession, which reports the same cookie-backed flag.
  const loggedIn = useState<boolean>(
    'auth-session-protected-logged-in',
    () => false,
  )
  const requestFetch = useRequestFetch()
  // The protected-access check is local to Nuxt, so it also works on sites
  // without Drupal accounts and avoids a Drupal round trip per navigation.
  const { execute } = useAsyncData(
    'stir-auth-protected-session',
    async () => {
      const session = await requestFetch<ProtectedSessionResponse>('/api/auth/protected')

      loggedIn.value = Boolean(session?.protectedAuthenticated)
      ready.value = true

      return session
    },
    {
      default: () => null,
      immediate: false,
      dedupe: 'defer',
    },
  )

  const fetchSession = async (options: FetchProtectedSessionOptions = {}) => {
    if (ready.value && !options.force) return

    await execute({ dedupe: options.force ? 'cancel' : 'defer' })
  }

  const clearSession = () => {
    loggedIn.value = false
    ready.value = true
  }

  return {
    ready,
    loggedIn,
    fetchSession,
    clearSession,
  }
}
