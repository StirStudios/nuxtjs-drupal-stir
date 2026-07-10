export type AuthSessionUser = {
  uid: number
  name: string
  mail: string
  roles: string[]
} & Record<string, unknown>

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
  } & Record<string, unknown>
}

export type RegisterPayload = {
  email: string
  password: string
  display_name?: string
  turnstile_response?: string
}

export type RegisterResponse = {
  created?: boolean
  uid?: number
  name?: string
  mail?: string
  verification_required?: boolean
  verification_sent?: boolean
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

export type PasswordResetValidatePayload = {
  uid: number
  timestamp: number
  hash: string
}

export type AuthIdentifierMode = 'email' | 'username' | 'email_or_username'

export type AuthUiField = {
  label?: string
  placeholder?: string
  requiredMessage?: string
  invalidMessage?: string
}

export type AuthUiIdentifierField = AuthUiField & {
  mode?: AuthIdentifierMode
}

export type AuthUiMessage = {
  title?: string
  description?: string
}

export type AuthPasswordRequirement = {
  key?: string
  pattern?: string
  label?: string
  message?: string
}

export type AuthPasswordPolicy = {
  minLength?: number
  maxLength?: number
  requiredMessage?: string
  minLengthMessage?: string
  maxLengthMessage?: string
  lowercaseMessage?: string
  uppercaseMessage?: string
  numberMessage?: string
  notSameAsCurrentMessage?: string
  requirements?: AuthPasswordRequirement[]
  strengthLabels?: {
    empty?: string
    weak?: string
    medium?: string
    strong?: string
    mustContain?: string
  }
}

export type AuthUiConfig = {
  version?: number
  loginRedirectPath?: string
  logoutRedirectPath?: string
  identifierModes?: {
    login?: AuthIdentifierMode
    passwordRequest?: AuthIdentifierMode
  }
  login?: {
    title?: string
    description?: string
    submitLabel?: string
    identifier?: AuthUiIdentifierField
    password?: AuthUiField
    successToast?: AuthUiMessage
  }
  register?: {
    title?: string
    description?: string
    submitLabel?: string
    email?: AuthUiField
    password?: AuthUiField
    complete?: {
      verificationTitle?: string
      createdTitle?: string
      verificationSentDescription?: string
      verificationRequiredDescription?: string
      createdDescription?: string
    }
  }
  passwordRequest?: {
    title?: string
    description?: string
    submitLabel?: string
    identifier?: AuthUiIdentifierField
    sentTitle?: string
    sentDescription?: string
  }
  passwordReset?: {
    title?: string
    description?: string
    submitLabel?: string
    password?: AuthUiField
    confirmPassword?: AuthUiField & {
      mismatchMessage?: string
    }
    checkingTitle?: string
    unavailableTitle?: string
    invalidLinkMessage?: string
    expiredLinkMessage?: string
    successToast?: AuthUiMessage
  }
  verify?: {
    loadingTitle?: string
    successTitle?: string
    failedTitle?: string
    loadingDescription?: string
    invalidDescription?: string
    successDescription?: string
    failedDescription?: string
  }
  protectedPage?: {
    title?: string
    description?: string
  }
  passwordPolicy?: AuthPasswordPolicy
}
