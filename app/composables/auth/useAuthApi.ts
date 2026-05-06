import type {
  LoginResponse,
  PasswordRequestPayload,
  PasswordResetPayload,
  PasswordResetValidatePayload,
  RegisterPayload,
  RegisterResponse,
} from '~/types/auth'

export function useAuthApi() {
  const login = (payload: {
    identifier: string
    password: string
    turnstile_response?: string
  }) =>
    $fetch<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: payload,
    })

  const logout = () =>
    $fetch('/api/auth/logout', {
      method: 'POST',
    })

  const register = (payload: RegisterPayload) =>
    $fetch<RegisterResponse>('/api/auth/register', {
      method: 'POST',
      body: payload,
    })

  const requestPasswordReset = (payload: PasswordRequestPayload) =>
    $fetch('/api/auth/password/request', {
      method: 'POST',
      body: payload,
    })

  const resetPassword = (payload: PasswordResetPayload) =>
    $fetch('/api/auth/password/reset', {
      method: 'POST',
      body: payload,
    })

  const validatePasswordReset = (payload: PasswordResetValidatePayload) =>
    $fetch('/api/auth/password/validate', {
      method: 'POST',
      body: payload,
    })

  const loginProtected = (password: string) =>
    $fetch('/api/auth/protected', {
      method: 'POST',
      body: { password },
    })

  const logoutProtected = () =>
    $fetch('/api/auth/protected', {
      method: 'POST',
      body: { action: 'logout' },
    })

  return {
    login,
    logout,
    register,
    requestPasswordReset,
    resetPassword,
    validatePasswordReset,
    loginProtected,
    logoutProtected,
  }
}
