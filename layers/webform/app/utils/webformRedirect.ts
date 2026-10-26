export interface WebformRedirectTarget {
  to: string
  external: boolean
}

export type SupportedWebformConfirmationType = 'inline' | 'url'

export function normalizeWebformConfirmationType(
  confirmationType: unknown,
): SupportedWebformConfirmationType {
  return confirmationType === 'url' ? 'url' : 'inline'
}

export function resolveWebformRedirect(
  confirmationType: unknown,
  redirect: unknown,
): WebformRedirectTarget | null {
  if (
    normalizeWebformConfirmationType(confirmationType) !== 'url'
    || typeof redirect !== 'string'
  ) {
    return null
  }

  const value = redirect.trim()

  if (value === '<front>') return { to: '/', external: false }

  // A browser reads `/\` as `//`, another site.
  if (value.startsWith('/') && !/^\/[\\/]/.test(value)) {
    return { to: value, external: false }
  }

  try {
    const url = new URL(value)

    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return { to: url.toString(), external: true }
    }
  } catch {
    return null
  }

  return null
}

/**
 * Redirect after a submission. Drupal's submit response carries the
 * confirmation URL resolved for that submission (tokens replaced) when the
 * site includes confirmation settings; otherwise the form's own redirect is used.
 */
export function resolveSubmissionRedirect(
  response: unknown,
  confirmationType: unknown,
  redirect: unknown,
): WebformRedirectTarget | null {
  const submitted = response && typeof response === 'object'
    ? response as { confirmation_type?: unknown, confirmation_url?: unknown }
    : {}

  if (typeof submitted.confirmation_url === 'string' && submitted.confirmation_url.trim()) {
    return resolveWebformRedirect(submitted.confirmation_type ?? confirmationType, submitted.confirmation_url)
  }

  return resolveWebformRedirect(confirmationType, redirect)
}

/**
 * Inline confirmation message after a submission: the message Drupal resolved
 * for that submission (tokens replaced, or set by a handler) when the response
 * carries one, otherwise the form's own message.
 */
export function resolveSubmissionMessage(response: unknown, fallback: string): string {
  const message = response && typeof response === 'object'
    ? (response as { confirmation_message?: unknown }).confirmation_message
    : undefined

  return typeof message === 'string' && message.trim() ? message : fallback
}
