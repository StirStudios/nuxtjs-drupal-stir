export interface WebformRedirectTarget {
  to: string
  external: boolean
}

export function resolveWebformRedirect(
  confirmationType: unknown,
  redirect: unknown,
): WebformRedirectTarget | null {
  if (
    !['url', 'url_message'].includes(String(confirmationType))
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
