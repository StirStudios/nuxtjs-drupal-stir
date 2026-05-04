export type AuthSessionUser = {
  uid: number
  name: string
  mail: string
  roles: string[]
}

export type AuthSessionResponse = {
  authenticated: boolean
  protectedAuthenticated: boolean
  user: AuthSessionUser | null
}

export type LoginResponse = {
  session?: {
    authenticated?: boolean
    uid?: number
    name?: string
    mail?: string
    roles?: string[]
  }
}

export type RegisterPayload = {
  email: string
  password: string
  display_name?: string
  turnstile_response?: string
}

export type PasswordRequestPayload = {
  identifier: string
  turnstile_response?: string
}

export type PasswordResetPayload = {
  uid: number
  timestamp: number
  hash: string
  password: string
}
