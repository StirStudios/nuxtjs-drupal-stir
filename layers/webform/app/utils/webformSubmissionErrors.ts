import type { FormError } from '@nuxt/ui'

type SubmissionErrorData = {
  error?: { message?: unknown, details?: unknown, flat?: unknown }
  message?: unknown
}

export type WebformSubmissionIssues = {
  message: string
  fieldErrors: FormError[]
}

const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#039;': '\'',
  '&#39;': '\'',
}

// Drupal form errors carry placeholder markup such as `<em class="placeholder">`.
function plainText(value: string): string {
  return value
    .replace(/<[^>]*>/g, '')
    .replace(/&(?:amp|lt|gt|quot|#0?39);/g, entity => ENTITIES[entity] ?? entity)
    .trim()
}

/**
 * Reads a stir_webform_rest refusal: Webform's own messages, with each one
 * Drupal keyed to an element (`event_dates` or `event_dates][0`) attached to
 * that field when the form shows it.
 */
export function resolveWebformSubmissionIssues(
  data: unknown,
  fieldNames: readonly string[],
  fallback = 'Form submission failed. Please try again.',
): WebformSubmissionIssues {
  const source = (data && typeof data === 'object' ? data : {}) as SubmissionErrorData
  const flat = Array.isArray(source.error?.flat)
    ? source.error.flat.filter((issue): issue is string => typeof issue === 'string' && issue.trim() !== '')
    : []
  const details = source.error?.details
  const fieldErrors: FormError[] = []

  if (details && typeof details === 'object' && !Array.isArray(details)) {
    for (const [key, value] of Object.entries(details)) {
      const name = key.split('][')[0] ?? key

      if (typeof value === 'string' && fieldNames.includes(name) && plainText(value)) {
        fieldErrors.push({ name, message: plainText(value) })
      }
    }
  }

  const message = flat.length
    ? flat.join(' ')
    : [source.error?.message, source.message].find(
        (value): value is string => typeof value === 'string' && value !== '',
      ) ?? fallback

  return { message, fieldErrors }
}
