import type { WebformFields } from '~/types'

type HiddenField = {
  '#type'?: string
  '#default_value'?: unknown
  '#defaultValue'?: unknown
}

export function getHiddenDefaults(
  fields: WebformFields,
): Record<string, unknown> {
  const hidden: Record<string, unknown> = {}

  for (const [key, field] of Object.entries(fields)) {
    const f = field as HiddenField

    if (f['#type'] === 'hidden') {
      hidden[key] = f['#default_value'] ?? f['#defaultValue'] ?? ''
    }
  }

  return hidden
}
