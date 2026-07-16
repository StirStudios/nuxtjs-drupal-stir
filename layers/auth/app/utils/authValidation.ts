import {
  check,
  custom,
  forward,
  object,
  pipe,
} from 'valibot'
import type {
  AuthIdentifierMode,
  AuthPasswordPolicy,
  AuthPasswordRequirement,
  AuthUiIdentifierField,
} from '../types/auth'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function requiredString(message: string) {
  return custom<string>(
    value => typeof value === 'string' && value.trim().length > 0,
    message,
  )
}

function requiredPassword(message: string) {
  return custom<string>(
    value => typeof value === 'string' && value.length > 0,
    message,
  )
}

function emailString(requiredMessage: string, invalidMessage: string) {
  return custom<string>(
    value => typeof value === 'string'
      && value.trim().length > 0
      && emailPattern.test(value.trim()),
    issue => typeof issue.input !== 'string' || issue.input.trim().length === 0
      ? requiredMessage
      : invalidMessage,
  )
}

const identifier = requiredString('Email or username is required')
const email = emailString('Email is required', 'Enter a valid email address')
const password = requiredPassword('Password is required')
const currentPassword = requiredPassword('Current password is required')

export const loginValidationSchema = object({ identifier, password })

export const registerValidationSchema = object({
  display_name: custom<string | undefined>(
    value => value === undefined
      || (typeof value === 'string' && value.trim().length <= 80),
    'Display name must be 80 characters or less',
  ),
  email,
  password,
})

export const passwordRequestValidationSchema = object({ identifier })

export const passwordResetValidationSchema = pipe(
  object({
    password,
    confirmPassword: requiredPassword('Confirm password is required'),
  }),
  forward(
    check(
      input => input.password === input.confirmPassword,
      'Passwords do not match',
    ),
    ['confirmPassword'],
  ),
)

export const accountPasswordChangeValidationSchema = pipe(
  object({ currentPassword, newPassword: password }),
  forward(
    check(
      input => !input.currentPassword
        || !input.newPassword
        || input.currentPassword !== input.newPassword,
      'New password must be different from current password',
    ),
    ['newPassword'],
  ),
)

export function createIdentifierValidationSchema(
  field: AuthUiIdentifierField = {},
) {
  const mode: AuthIdentifierMode = field.mode || 'email_or_username'
  const requiredMessage = field.requiredMessage || requiredIdentifierMessage(mode)
  const invalidMessage = field.invalidMessage || 'Enter a valid email address'

  return mode === 'email'
    ? emailString(requiredMessage, invalidMessage)
    : requiredString(requiredMessage)
}

export function createLoginValidationSchema(
  identifierField: AuthUiIdentifierField = {},
  passwordRequiredMessage = 'Password is required',
) {
  return object({
    identifier: createIdentifierValidationSchema(identifierField),
    password: requiredPassword(passwordRequiredMessage),
  })
}

export function createPasswordRequestValidationSchema(
  identifierField: AuthUiIdentifierField = {},
) {
  return object({ identifier: createIdentifierValidationSchema(identifierField) })
}

export function createRegisterValidationSchema(
  emailField: { requiredMessage?: string; invalidMessage?: string } = {},
  passwordPolicy: AuthPasswordPolicy = {},
) {
  return object({
    display_name: custom<string | undefined>(
      value => value === undefined
        || (typeof value === 'string' && value.trim().length <= 80),
      'Display name must be 80 characters or less',
    ),
    email: emailString(
      emailField.requiredMessage || 'Email is required',
      emailField.invalidMessage || 'Enter a valid email address',
    ),
    password: createPasswordValidationSchema(passwordPolicy),
  })
}

export function createPasswordResetValidationSchema(
  passwordPolicy: AuthPasswordPolicy = {},
  confirmPasswordRequiredMessage = 'Confirm password is required',
  confirmPasswordMismatchMessage = 'Passwords do not match',
) {
  return pipe(
    object({
      password: createPasswordValidationSchema(passwordPolicy),
      confirmPassword: requiredPassword(confirmPasswordRequiredMessage),
    }),
    forward(
      check(
        input => input.password === input.confirmPassword,
        confirmPasswordMismatchMessage,
      ),
      ['confirmPassword'],
    ),
  )
}

export function createAccountPasswordChangeValidationSchema(
  passwordPolicy: AuthPasswordPolicy = {},
) {
  return pipe(
    object({
      currentPassword,
      newPassword: createPasswordValidationSchema(passwordPolicy),
    }),
    forward(
      check(
        input => !input.currentPassword
          || !input.newPassword
          || input.currentPassword !== input.newPassword,
        passwordPolicy.notSameAsCurrentMessage
          || 'New password must be different from current password',
      ),
      ['newPassword'],
    ),
  )
}

export function createPasswordValidationSchema(policy: AuthPasswordPolicy = {}) {
  const requirements = validPasswordRequirements(policy)

  return custom<string>(
    value => passwordValidationMessage(value, policy, requirements) === null,
    issue => passwordValidationMessage(issue.input, policy, requirements)
      || policy.requiredMessage
      || 'Password is required',
  )
}

function passwordValidationMessage(
  value: unknown,
  policy: AuthPasswordPolicy,
  requirements: AuthPasswordRequirement[],
): string | null {
  if (typeof value !== 'string' || value.length === 0) {
    return policy.requiredMessage || 'Password is required'
  }

  if (typeof policy.minLength === 'number' && value.length < policy.minLength) {
    return policy.minLengthMessage
      || `Password must be at least ${policy.minLength} characters`
  }

  if (typeof policy.maxLength === 'number' && value.length > policy.maxLength) {
    return policy.maxLengthMessage
      || `Password must be ${policy.maxLength} characters or less`
  }

  for (const requirement of requirements) {
    const regex = passwordRequirementRegex(requirement)

    if (regex && !regex.test(value)) {
      return passwordRequirementMessage(policy, requirement)
    }
  }

  return null
}

function validPasswordRequirements(policy: AuthPasswordPolicy) {
  return (policy.requirements || []).filter(
    requirement => Boolean(passwordRequirementRegex(requirement)),
  )
}

function passwordRequirementRegex(requirement: AuthPasswordRequirement) {
  if (!requirement.pattern) return null

  try {
    return new RegExp(requirement.pattern)
  }
  catch {
    return null
  }
}

function passwordRequirementMessage(
  policy: AuthPasswordPolicy,
  requirement: AuthPasswordRequirement,
) {
  if (requirement.message) return requirement.message
  if (requirement.key === 'lowercase') {
    return policy.lowercaseMessage || requirement.label || 'Password must include a lowercase letter'
  }
  if (requirement.key === 'uppercase') {
    return policy.uppercaseMessage || requirement.label || 'Password must include an uppercase letter'
  }
  if (requirement.key === 'number') {
    return policy.numberMessage || requirement.label || 'Password must include a number'
  }

  return requirement.label || 'Password does not meet this requirement'
}

function requiredIdentifierMessage(mode: AuthIdentifierMode) {
  if (mode === 'email') return 'Email is required'
  if (mode === 'username') return 'Username is required'
  return 'Email or username is required'
}
