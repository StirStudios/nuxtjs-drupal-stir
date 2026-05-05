import { useAuthApi } from '~/composables/auth/useAuthApi'

export function useAuthAccount() {
  const api = useAuthApi()

  return {
    register: api.register,
    requestPasswordReset: api.requestPasswordReset,
    resetPassword: api.resetPassword,
    logout: api.logout,
  }
}
