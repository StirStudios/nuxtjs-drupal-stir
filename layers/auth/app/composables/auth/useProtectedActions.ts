import { useAuthApi } from './useAuthApi'
import { useProtectedSession } from './useProtectedSession'

export function useProtectedActions() {
  const authApi = useAuthApi()
  const session = useProtectedSession()

  const login = async (password: string) => {
    await authApi.loginProtected(password)
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
