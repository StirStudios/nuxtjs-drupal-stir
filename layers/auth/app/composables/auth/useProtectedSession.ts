type FetchProtectedSessionOptions = {
  force?: boolean
}

export function useProtectedSession() {
  const ready = useState<boolean>('auth-protected-session-ready', () => false)
  const loggedIn = useState<boolean>(
    'auth-session-protected-logged-in',
    () => false,
  )
  let pendingSessionFetch: Promise<void> | null = null

  const fetchSession = async (options: FetchProtectedSessionOptions = {}) => {
    if (ready.value && !options.force) return

    if (pendingSessionFetch) {
      await pendingSessionFetch
      return
    }

    const requestFetch = useRequestFetch()

    pendingSessionFetch = (async () => {
      const session = await requestFetch<{ protectedAuthenticated?: boolean }>(
        '/api/auth/protected',
      )

      loggedIn.value = Boolean(session?.protectedAuthenticated)
      ready.value = true
    })()

    try {
      await pendingSessionFetch
    } finally {
      pendingSessionFetch = null
    }
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
