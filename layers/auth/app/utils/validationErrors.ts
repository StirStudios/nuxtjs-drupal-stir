import {
  getDotPath,
  safeParse,
  type GenericSchema,
} from 'valibot'

export type FieldValidationError = {
  name: string
  message: string
}

export function validateForm(
  schema: GenericSchema,
  input: unknown,
  defaultName = '',
): FieldValidationError[] {
  const result = safeParse(schema, input, { abortEarly: false })

  if (result.success) return []

  const seen = new Set<string>()
  const errors: FieldValidationError[] = []

  for (const issue of result.issues) {
    const name = getDotPath(issue)?.trim() || defaultName.trim()
    const message = issue.message.trim()

    if (!name || !message) continue

    const key = `${name}:${message}`

    if (seen.has(key)) continue

    seen.add(key)
    errors.push({ name, message })
  }

  return errors
}
