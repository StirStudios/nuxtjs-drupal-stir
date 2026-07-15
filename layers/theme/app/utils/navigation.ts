import type { NavigationMenuItem } from '@nuxt/ui'

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

export type DrupalMenuTreeItem = DrupalMenuItemLink & {
  title?: string
  children?: DrupalMenuTreeItem[]
  below?: DrupalMenuTreeItem[]
  items?: DrupalMenuTreeItem[]
  options?: DrupalMenuItemLink['options'] & {
    attributes?: {
      target?: string
    }
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

function menuChildren(item: DrupalMenuTreeItem): DrupalMenuTreeItem[] {
  if (Array.isArray(item.children)) return item.children
  if (Array.isArray(item.below)) return item.below
  if (Array.isArray(item.items)) return item.items

  return []
}

export function mapDrupalMenuItem(item: DrupalMenuTreeItem): NavigationMenuItem {
  const children = menuChildren(item).map(mapDrupalMenuItem)
  const to = menuItemTo(item)
  const hasChildren = children.length > 0
  const hasHash = typeof to === 'string' && to.includes('#')

  return {
    label: item.title ?? '',
    to: hasChildren ? undefined : to,
    exact: !hasChildren,
    exactHash: !hasChildren && hasHash,
    target: !hasChildren && item.external
      ? item.options?.attributes?.target || '_blank'
      : undefined,
    children: hasChildren ? children : undefined,
  }
}

export function splitMenuAtMarker(
  items: NavigationMenuItem[],
  marker?: string,
): { before: NavigationMenuItem[], after: NavigationMenuItem[], markerIndex: number } {
  const markerIndex = marker
    ? items.findIndex(item => item.label === marker)
    : -1

  return {
    before: markerIndex > -1 ? items.slice(0, markerIndex) : items,
    after: markerIndex > -1 ? items.slice(markerIndex + 1) : [],
    markerIndex,
  }
}
