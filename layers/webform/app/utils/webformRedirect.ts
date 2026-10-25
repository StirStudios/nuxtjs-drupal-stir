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

  if (value.startsWith('/') && !value.startsWith('//')) {
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
