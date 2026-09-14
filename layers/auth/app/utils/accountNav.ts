import type { NavigationMenuItem } from '@nuxt/ui'
import type { AppConfig } from 'nuxt/schema'

/**
 * One account navigation entry authored in `app.config` `auth.accountNav.items`.
 */
export type AccountNavItemConfig = NonNullable<
  NonNullable<NonNullable<AppConfig['auth']>['accountNav']>['items']
>[number]

export const DEFAULT_ACCOUNT_NAV_ITEMS: readonly AccountNavItemConfig[] = [
  {
    label: 'Settings',
    icon: 'i-lucide-settings',
    to: '/account/settings',
  },
]

const isItemConfig = (value: unknown): value is AccountNavItemConfig => {
  if (!value || typeof value !== 'object') return false

  const item = value as Record<string, unknown>

  return typeof item.label === 'string'
    && item.label.trim().length > 0
    && typeof item.to === 'string'
    && item.to.trim().length > 0
}

/**
 * Resolves configured account nav entries into Nuxt UI navigation items.
 *
 * Falls back to the layer default when no usable items are configured. App
 * config arrays merge by concatenation across layers, so the default lives
 * here rather than in the layer's `app.config`, where it would be duplicated
 * into every project list.
 */
export function resolveAccountNavItems(
  configured: unknown,
  isVisible: (key: string) => boolean,
): NavigationMenuItem[] {
  const usable = Array.isArray(configured) ? configured.filter(isItemConfig) : []
  const source = usable.length > 0 ? usable : DEFAULT_ACCOUNT_NAV_ITEMS

  return source
    .filter(item => !item.visibility || isVisible(item.visibility))
    .map(({ label, icon, to }) => (icon ? { label, icon, to } : { label, to }))
}
