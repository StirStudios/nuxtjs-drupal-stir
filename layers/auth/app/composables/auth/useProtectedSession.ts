import { useAuthSession } from './useAuthSession'

export function useProtectedSession() {
  const authSession = useAuthSession()

  const ready = computed(() => authSession.ready.value)
  const loggedIn = computed(() => authSession.protectedLoggedIn.value)

  const fetchSession = async () => {
    await authSession.fetchSession()
  }

  const clearSession = () => {
    authSession.protectedLoggedIn.value = false
    authSession.ready.value = true
  }

  return {
    ready,
    loggedIn,
    fetchSession,
    clearSession,
  }
}
