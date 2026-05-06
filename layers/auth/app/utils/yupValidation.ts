import { ValidationError } from 'yup'

export type FieldValidationError = {
  name: string
  message: string
}

export const mapYupValidationErrors = (
  error: unknown,
): FieldValidationError[] => {
  if (!(error instanceof ValidationError)) {
    return []
  }

  const flattened = error.inner.length > 0 ? error.inner : [error]
  const seen = new Set<string>()
  const errors: FieldValidationError[] = []

  for (const entry of flattened) {
    const name = String(entry.path ?? '').trim()
    const message = String(entry.message ?? '').trim()

    if (!name || !message) {
      continue
    }

    const key = `${name}:${message}`

    if (seen.has(key)) {
      continue
    }

    seen.add(key)
    errors.push({ name, message })
  }

  return errors
}

