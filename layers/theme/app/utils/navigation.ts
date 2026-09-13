import type { ButtonProps, NavigationMenuItem } from '@nuxt/ui'

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
  description?: string
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
  const description = item.description?.trim() || undefined

  return {
    label: item.title ?? '',
    description,
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

export type HeaderActionRule = {
  match?: string | number
  as?: 'button' | 'navigation' | string
  mobile?: 'menu' | 'button' | 'hidden' | string
  color?: string
  variant?: string
  size?: string
  class?: string
  icon?: string
}

export type HeaderActionItem = {
  item: NavigationMenuItem
  as: 'button' | 'navigation'
  mobile: 'menu' | 'button' | 'hidden'
  button: Pick<ButtonProps, 'color' | 'variant' | 'size' | 'icon'> & { class?: string }
}

// Moves top-level menu items matched by label or position (negative counts
// from the end) into the header actions region, in rule order.
export function extractHeaderActions(
  items: NavigationMenuItem[],
  rules: unknown,
): { items: NavigationMenuItem[], actions: HeaderActionItem[] } {
  const taken = new Set<NavigationMenuItem>()
  const actions: HeaderActionItem[] = []

  for (const rule of Array.isArray(rules) ? rules as HeaderActionRule[] : []) {
    const index = typeof rule?.match === 'number'
      ? (rule.match < 0 ? items.length + rule.match : rule.match)
      : items.findIndex(item => typeof rule?.match === 'string' && item.label === rule.match)
    const item = Number.isInteger(index) ? items[index] : undefined

    if (!item || taken.has(item)) continue

    taken.add(item)
    actions.push({
      item,
      as: rule.as === 'button' ? 'button' : 'navigation',
      mobile: rule.mobile === 'button' || rule.mobile === 'hidden' ? rule.mobile : 'menu',
      button: {
        color: rule.color as ButtonProps['color'],
        variant: rule.variant as ButtonProps['variant'],
        size: rule.size as ButtonProps['size'],
        class: rule.class,
        icon: rule.icon,
      },
    })
  }

  return {
    items: taken.size ? items.filter(item => !taken.has(item)) : items,
    actions,
  }
}
