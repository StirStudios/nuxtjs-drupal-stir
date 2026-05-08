import type { NavigationMenuItem } from '@nuxt/ui'

export function useAccountNav() {
  const items: NavigationMenuItem[] = [
    {
      label: 'Settings',
      icon: 'i-lucide-settings',
      to: '/account/settings',
    },
    {
      label: 'Profile',
      icon: 'i-lucide-user-round',
      to: '/account/profile',
    },
  ]

  return {
    items,
  }
}
