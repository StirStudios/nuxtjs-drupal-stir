export type DrupalMenuItemLink = {
  external?: boolean
  absolute?: string
  alias?: string
  relative?: string
  url?: string
  uri?: string
  options?: {
    fragment?: string
  }
}

function sanitizeMenuPath(value: string): string {
  return value.replace(/^internal:/, '').replace(/^base:/, '').trim()
}

function withFragment(path: string, fragment?: string): string {
  const cleanFragment = fragment?.replace(/^#+/, '').trim()

  if (!cleanFragment || path.includes('#')) return path

  return `${path}#${cleanFragment}`
}

export function normalizeInternalMenuPath(value?: string, fragment?: string): string {
  const cleanValue = sanitizeMenuPath(value ?? '')

  if (/^https?:\/\//.test(cleanValue)) {
    const parsed = new URL(cleanValue)
    const path = `${parsed.pathname}${parsed.search}`

    return withFragment(path, parsed.hash.replace(/^#/, '') || fragment)
  }

  const [rawPath = '', embeddedFragment] = cleanValue.split('#', 2)
  const path = !rawPath || rawPath === '<front>'
    ? '/'
    : rawPath.startsWith('/') ? rawPath : `/${rawPath}`

  return withFragment(path, embeddedFragment || fragment)
}

export function menuItemTo(item: DrupalMenuItemLink): string {
  const value = String(
    item.relative || item.alias || item.uri || item.url || item.absolute || '',
  )

  if (item.external) return withFragment(value, item.options?.fragment)

  if (value.startsWith('mailto:') || value.startsWith('tel:')) {
    return withFragment(value, item.options?.fragment)
  }

  return normalizeInternalMenuPath(value, item.options?.fragment)
}
