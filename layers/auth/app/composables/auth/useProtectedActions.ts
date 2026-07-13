import { useAuthApi } from './useAuthApi'
import { useProtectedSession } from './useProtectedSession'

export function useProtectedActions() {
  const authApi = useAuthApi()
  const session = useProtectedSession()

  const login = async (password: string, turnstileResponse: string) => {
    await authApi.loginProtected(password, turnstileResponse)
    await session.fetchSession({ force: true })

    return session.loggedIn.value
  }

  const logout = async () => {
    await authApi.logoutProtected()
    await session.fetchSession({ force: true })
  }

  return {
    login,
    logout,
  }
}
