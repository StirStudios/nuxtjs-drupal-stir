import type { FormError } from '@nuxt/ui'

export type ProfileFieldValidationInput = {
  name: string
  label: string
  type: string
  required: boolean
  editable: boolean
  /**
   * Drupal field cardinality: 1 for single-value, N for a limit, -1 unlimited.
   */
  cardinality?: number
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const mentionsEmail = (field: ProfileFieldValidationInput): boolean => {
  const name = field.name.trim().toLowerCase()
  const label = field.label.trim().toLowerCase()

  return name.includes('email') || name === 'mail' || label.includes('email')
}

// Email rules apply to Drupal email fields, and to link fields that hold an
// email address (commonly stored as a `mailto:` URI). Other field types are
// never email-validated, whatever they are named.
const isEmailField = (field: ProfileFieldValidationInput): boolean =>
  field.type === 'email' || (field.type === 'link' && mentionsEmail(field))

const isUrlField = (field: ProfileFieldValidationInput): boolean =>
  field.type === 'link' && !isEmailField(field)

const isValidEmail = (value: string): boolean =>
  EMAIL_PATTERN.test(value.replace(/^mailto:/i, ''))

const isValidUrl = (value: string): boolean => {
  try {
    const url = new URL(value)

    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

const isBlank = (value: unknown): boolean =>
  value === null
  || value === undefined
  || (typeof value === 'string' && value.trim().length === 0)

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
    const entries = (Array.isArray(rawValue) ? rawValue : [rawValue])
      .filter(entry => !isBlank(entry))
    const label = field.label || 'This field'

    if (entries.length === 0) {
      if (field.required) {
        errors.push({ name: field.name, message: `${label} is required` })
      }
      continue
    }

    const cardinality = field.cardinality ?? 1

    if (cardinality > 0 && entries.length > cardinality) {
      errors.push({
        name: field.name,
        message: cardinality === 1
          ? `${label} accepts a single value`
          : `${label} accepts at most ${cardinality} values`,
      })
      continue
    }

    const strings = entries
      .filter((entry): entry is string => typeof entry === 'string')
      .map(entry => entry.trim())

    if (isEmailField(field) && strings.some(entry => !isValidEmail(entry))) {
      errors.push({ name: field.name, message: 'Enter a valid email address' })
    } else if (isUrlField(field) && strings.some(entry => !isValidUrl(entry))) {
      errors.push({
        name: field.name,
        message: 'Enter a valid URL starting with http:// or https://',
      })
    }
  }

  return errors
}
