import { getFetchErrorMessage } from '../../utils/fetchError'
import { useAuthApi } from './useAuthApi'
import { useAuthSession } from './useAuthSession'

export function useAuthActions() {
  const authApi = useAuthApi()
  const session = useAuthSession()

  const login = async (payload: {
    identifier: string
    password: string
    turnstile_response?: string
  }) => {
    const response = await authApi.login(payload)

    await session.fetchSession()

    return {
      response,
      loggedIn: session.loggedIn.value,
    }
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } finally {
      session.clearSession()
    }
  }

  const register = (payload: {
    email: string
    password: string
    display_name?: string
    turnstile_response?: string
  }) => authApi.register(payload)

  const requestPasswordReset = (payload: {
    identifier: string
    turnstile_response?: string
  }) => authApi.requestPasswordReset(payload)

  const resetPassword = (payload: {
    uid: number
    timestamp: number
    hash: string
    password: string
  }) => authApi.resetPassword(payload)

  const validatePasswordReset = (payload: {
    uid: number
    timestamp: number
    hash: string
  }) => authApi.validatePasswordReset(payload)

  return {
    login,
    logout,
    register,
    requestPasswordReset,
    resetPassword,
    validatePasswordReset,
    getFetchErrorMessage,
  }
}
