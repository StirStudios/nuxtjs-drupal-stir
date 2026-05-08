import { useAuthApi } from './useAuthApi'
import { useAuthSession } from './useAuthSession'

export function useProtectedActions() {
  const authApi = useAuthApi()
  const session = useAuthSession()

  const login = async (password: string) => {
    await authApi.loginProtected(password)
    await session.fetchSession()

    return session.protectedLoggedIn.value
  }

  const logout = async () => {
    await authApi.logoutProtected()
    await session.fetchSession()
  }

  return {
    login,
    logout,
  }
}
