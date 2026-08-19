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
