import { object, ref as yupRef, string } from 'yup'
import type {
  AuthIdentifierMode,
  AuthPasswordPolicy,
  AuthPasswordRequirement,
  AuthUiIdentifierField,
} from '../types/auth'

const identifier = string().trim().required('Email or username is required')

const email = string()
  .trim()
  .email('Enter a valid email address')
  .required('Email is required')

const password = string()
  .trim()
  .required('Password is required')
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be 128 characters or less')
  .matches(/[a-z]/, 'Password must include a lowercase letter')
  .matches(/[A-Z]/, 'Password must include an uppercase letter')
  .matches(/[0-9]/, 'Password must include a number')

const currentPassword = string().trim().required('Current password is required')

const newPassword = password.test(
  'not-same-as-current',
  'New password must be different from current password',
  function (value) {
    const current = String(this.parent.currentPassword ?? '').trim()
    const next = String(value ?? '').trim()

    if (!current || !next) {
      return true
    }

    return current !== next
  },
)

export const loginValidationSchema = object({
  identifier,
  password: string().trim().required('Password is required'),
})

export const registerValidationSchema = object({
  display_name: string().trim().max(80, 'Display name must be 80 characters or less'),
  email,
  password,
})

export const passwordRequestValidationSchema = object({
  identifier,
})

export const passwordResetValidationSchema = object({
  password,
  confirmPassword: string()
    .trim()
    .required('Confirm password is required')
    .oneOf([yupRef('password')], 'Passwords do not match'),
})

export const accountPasswordChangeValidationSchema = object({
  currentPassword,
  newPassword,
})

export function createIdentifierValidationSchema(
  field: AuthUiIdentifierField = {},
) {
  const mode: AuthIdentifierMode = field.mode || 'email_or_username'
  const requiredMessage = field.requiredMessage || requiredIdentifierMessage(mode)
  const invalidMessage = field.invalidMessage || 'Enter a valid email address'
  const base = string().trim().required(requiredMessage)

  if (mode === 'email') {
    return base.email(invalidMessage)
  }

  return base
}

export function createLoginValidationSchema(
  identifierField: AuthUiIdentifierField = {},
  passwordRequiredMessage = 'Password is required',
) {
  return object({
    identifier: createIdentifierValidationSchema(identifierField),
    password: string().trim().required(passwordRequiredMessage),
  })
}

export function createPasswordRequestValidationSchema(
  identifierField: AuthUiIdentifierField = {},
) {
  return object({
    identifier: createIdentifierValidationSchema(identifierField),
  })
}

export function createRegisterValidationSchema(
  emailField: {
    requiredMessage?: string
    invalidMessage?: string
  } = {},
  passwordPolicy: AuthPasswordPolicy = {},
) {
  return object({
    display_name: string().trim().max(80, 'Display name must be 80 characters or less'),
    email: string()
      .trim()
      .email(emailField.invalidMessage || 'Enter a valid email address')
      .required(emailField.requiredMessage || 'Email is required'),
    password: createPasswordValidationSchema(passwordPolicy),
  })
}

export function createPasswordResetValidationSchema(
  passwordPolicy: AuthPasswordPolicy = {},
  confirmPasswordRequiredMessage = 'Confirm password is required',
  confirmPasswordMismatchMessage = 'Passwords do not match',
) {
  const policyPassword = createPasswordValidationSchema(passwordPolicy)

  return object({
    password: policyPassword,
    confirmPassword: string()
      .trim()
      .required(confirmPasswordRequiredMessage)
      .oneOf([yupRef('password')], confirmPasswordMismatchMessage),
  })
}

export function createAccountPasswordChangeValidationSchema(
  passwordPolicy: AuthPasswordPolicy = {},
) {
  return object({
    currentPassword,
    newPassword: createPasswordValidationSchema(passwordPolicy).test(
      'not-same-as-current',
      passwordPolicy.notSameAsCurrentMessage ||
        'New password must be different from current password',
      function (value) {
        const current = String(this.parent.currentPassword ?? '').trim()
        const next = String(value ?? '').trim()

        if (!current || !next) {
          return true
        }

        return current !== next
      },
    ),
  })
}

function createPasswordValidationSchema(policy: AuthPasswordPolicy = {}) {
  const minLength = policy.minLength ?? 8
  const maxLength = policy.maxLength ?? 128
  const requirements = validPasswordRequirements(policy)
  let schema = string()
    .trim()
    .required(policy.requiredMessage || 'Password is required')
    .min(minLength, policy.minLengthMessage || `Password must be at least ${minLength} characters`)
    .max(maxLength, policy.maxLengthMessage || `Password must be ${maxLength} characters or less`)

  if (requirements.length > 0) {
    for (const requirement of requirements) {
      const regex = passwordRequirementRegex(requirement)

      if (!regex || requirement.key === 'minLength' || requirement.key === 'maxLength') {
        continue
      }

      schema = schema.matches(regex, passwordRequirementMessage(policy, requirement))
    }

    return schema
  }

  return schema
    .matches(/[a-z]/, policy.lowercaseMessage || 'Password must include a lowercase letter')
    .matches(/[A-Z]/, policy.uppercaseMessage || 'Password must include an uppercase letter')
    .matches(/[0-9]/, policy.numberMessage || 'Password must include a number')
}

function validPasswordRequirements(policy: AuthPasswordPolicy) {
  return (policy.requirements || []).filter(requirement => Boolean(passwordRequirementRegex(requirement)))
}

function passwordRequirementRegex(requirement: AuthPasswordRequirement) {
  if (!requirement.pattern) {
    return null
  }

  try {
    return new RegExp(requirement.pattern)
  } catch {
    return null
  }
}

function passwordRequirementMessage(
  policy: AuthPasswordPolicy,
  requirement: AuthPasswordRequirement,
) {
  if (requirement.message) {
    return requirement.message
  }

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
  if (mode === 'email') {
    return 'Email is required'
  }

  if (mode === 'username') {
    return 'Username is required'
  }

  return 'Email or username is required'
}
