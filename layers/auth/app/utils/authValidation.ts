import { object, ref as yupRef, string } from 'yup'

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
