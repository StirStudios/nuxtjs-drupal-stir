import type {
  PasswordRequestPayload,
  PasswordResetPayload,
  RegisterPayload,
} from '~/types/auth'

export function useAuthAccount() {
  const register = async (payload: RegisterPayload) =>
    await $fetch('/api/auth/register', {
      method: 'POST',
      body: payload,
    })

  const requestPasswordReset = async (payload: PasswordRequestPayload) =>
    await $fetch('/api/auth/password/request', {
      method: 'POST',
      body: payload,
    })

  const resetPassword = async (payload: PasswordResetPayload) =>
    await $fetch('/api/auth/password/reset', {
      method: 'POST',
      body: payload,
    })

  const logout = async () => await $fetch('/api/auth/logout', { method: 'POST' })

  return {
    register,
    requestPasswordReset,
    resetPassword,
    logout,
  }
}
