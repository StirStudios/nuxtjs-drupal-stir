import type { FormError } from '@nuxt/ui'

export type ProfileFieldValidationInput = {
  name: string
  label: string
  type: string
  required: boolean
  editable: boolean
}

const isEmailField = (field: ProfileFieldValidationInput): boolean => {
  const name = field.name.trim().toLowerCase()
  const label = field.label.trim().toLowerCase()

  if (name === 'mail' || name === 'email' || name.includes('email')) {
    return true
  }

  return label === 'email' || label.includes('email')
}

export const validateProfileValues = (
  fields: ProfileFieldValidationInput[],
  state: Record<string, unknown>,
): FormError[] => {
  const errors: FormError[] = []

  for (const field of fields) {
    if (!field.editable) {
      continue
    }

    const rawValue = state[field.name]
    const value = typeof rawValue === 'string' ? rawValue.trim() : rawValue
    const isEmptyString = typeof value === 'string' && value.length === 0
    const isMissing = value === null || value === undefined || isEmptyString

    if (field.required && isMissing) {
      errors.push({
        name: field.name,
        message: `${field.label || 'This field'} is required`,
      })
      continue
    }

    if (isEmailField(field) && typeof value === 'string' && value.length > 0) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

      if (!emailPattern.test(value)) {
        errors.push({
          name: field.name,
          message: 'Enter a valid email address',
        })
      }
    }
  }

  return errors
}

