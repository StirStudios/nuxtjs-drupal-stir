<script setup lang="ts">
import { useMediaQuery } from '@vueuse/core'
import { getDrupalOrigin, toDrupalUrl } from '#stir/utils/drupalUrl'
import { withEditorDestination } from '#stir/utils/layoutEditLinks'
import {
  adminUiTheme,
  type EditorialTaskLink,
  withUnpublishedTask,
} from '../../utils/adminUiTheme'

const { getPage } = useStirDrupalCe()
const page = getPage()
const route = useRoute()
const requestUrl = useRequestURL()
const config = useRuntimeConfig()
const user = computed(() => page.value?.current_user || null)
const { hasEditorialAccess, isAuthenticated } = usePageContext()

const iconMap: Record<string, string> = {
  'Drupal CMS': 'i-lucide-layout-dashboard',
  Settings: 'i-lucide-settings',
  View: 'i-lucide-eye',
  Edit: 'i-lucide-square-pen',
  Delete: 'i-lucide-trash',
  Revisions: 'i-lucide-history',
  Export: 'i-lucide-file-up',
  API: 'i-lucide-braces',
  'Log out': 'i-lucide-log-out',
  'Log in': 'i-lucide-log-in',
  'My account': 'i-lucide-circle-user',
}

const getIconForLabel = (label: string): string | null => {
  return iconMap[label] || null
}

type LocalTask = { label: string; url: string; active?: boolean }
type LocalTasks = { primary: LocalTask[]; secondary: LocalTask[] }
type MenuLink = EditorialTaskLink
type AccountMenuItem = { title?: string; relative?: string; url?: string }
type AccountMenuFetchOptions = NonNullable<
  Parameters<typeof $fetch<AccountMenuItem[]>>[1]
>
type DrupalCeConfig = {
  drupalBaseUrl?: string
  ceApiEndpoint?: string
  menuEndpoint?: string
  menuBaseUrl?: string
  fetchOptions?: AccountMenuFetchOptions
}

const getValidTo = (value: unknown): string | null => {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()

  return trimmed.length ? trimmed : null
}

const isCompactTabs = useMediaQuery('(max-width: 767px)')
const frontendReturnUrl = computed(() =>
  new URL(route.fullPath, requestUrl.origin).toString(),
)

const navigateAdminLink = (event: Event, destination: string) => {
  const originalEvent =
    event instanceof CustomEvent && event.detail?.originalEvent instanceof Event
      ? event.detail.originalEvent
      : event

  if (
    originalEvent instanceof MouseEvent &&
    (originalEvent.metaKey ||
      originalEvent.ctrlKey ||
      originalEvent.shiftKey ||
      originalEvent.altKey)
  ) {
    return
  }

  originalEvent.preventDefault()

  if (import.meta.client) {
    window.location.assign(destination)
  }
}

const getAdminLinkSelectHandler = (destination: string) => {
  const destinationOrigin = new URL(destination, requestUrl.origin).origin

  return destinationOrigin === drupalOrigin.value
    ? (event: Event) => navigateAdminLink(event, destination)
    : undefined
}

const tabs = computed<LocalTasks>(() => {
  const localTasks = page.value?.local_tasks as Partial<LocalTasks> | undefined

  return {
    primary: Array.isArray(localTasks?.primary) ? localTasks.primary : [],
    secondary: Array.isArray(localTasks?.secondary) ? localTasks.secondary : [],
  }
})

const localTaskLinks = computed(() =>
  tabs.value.primary
    .map((tab: LocalTask): MenuLink | null => {
      const rawTo = getValidTo(tab.url)

      if (!rawTo) return null

      const to = normalizeAdminUrl(rawTo)

      return {
        label: tab.label,
        to,
        icon: getIconForLabel(tab.label),
        tooltip: isCompactTabs.value,
        active: tab.active === true,
        onSelect: getAdminLinkSelectHandler(to),
      }
    })
    .filter((tab): tab is MenuLink => tab !== null),
)

const editorialTaskLinks = computed(() =>
  withUnpublishedTask(localTaskLinks.value, page.value?.published),
)

const accountMenu = useState<MenuLink[]>('drupal-tabs-account-menu', () => [])
const isAccountMenuLoaded = useState<boolean>(
  'drupal-tabs-account-menu-loaded',
  () => false,
)
const accountMenuUserId = useState<string>(
  'drupal-tabs-account-menu-user-id',
  () => '',
)
const currentUserId = computed(() =>
  String(user.value?.id ?? user.value?.uid ?? 'anon'),
)
const drupalCeConfig = computed<DrupalCeConfig>(() => {
  return (config.public.drupalCe || {}) as DrupalCeConfig
})
const drupalOrigin = computed(() =>
  getDrupalOrigin(config.public as Record<string, unknown>),
)

const normalizeAdminUrl = (value: string): string => {
  const trimmed = value.trim()
  const normalizedPath = (() => {
    if (trimmed.startsWith('/')) {
      const [path = ''] = trimmed.split('?')

      return path
    }

    try {
      const url = new URL(trimmed)

      return url.pathname
    } catch {
      return trimmed || '/'
    }
  })()

  if (
    normalizedPath === '/user/logout' ||
    normalizedPath.endsWith('/user/logout')
  ) {
    return '/auth/logout'
  }

  if (
    normalizedPath === '/user/login' ||
    normalizedPath.endsWith('/user/login')
  ) {
    return '/auth/login'
  }

  if (
    normalizedPath === '/user/password' ||
    normalizedPath.endsWith('/user/password')
  ) {
    return '/auth/password'
  }

  if (normalizedPath === '/user' || normalizedPath.endsWith('/user')) {
    return '/account/settings'
  }

  return withEditorDestination(
    toDrupalUrl(value, drupalOrigin.value),
    frontendReturnUrl.value,
  )
}

const getAccountMenuUrl = (): string => {
  const menuEndpoint = String(
    drupalCeConfig.value.menuEndpoint || 'api/menu_items/$$$NAME$$$',
  )
  const menuPath = menuEndpoint
    .replace('$$$NAME$$$', 'account')
    .replace(/^\/+/, '')

  return `/api/menu/${menuPath}`
}

const loadAccountMenu = async () => {
  if (accountMenuUserId.value !== currentUserId.value) {
    accountMenu.value = []
    isAccountMenuLoaded.value = false
    accountMenuUserId.value = currentUserId.value
  }

  if (!hasEditorialAccess.value || !isAuthenticated.value || isAccountMenuLoaded.value) {
    return
  }

  try {
    const accountMenuUrl = getAccountMenuUrl()
    const configuredFetchOptions = (drupalCeConfig.value.fetchOptions ||
      {}) as AccountMenuFetchOptions
    const credentials =
      drupalCeConfig.value.fetchOptions?.credentials || 'include'
    const rawMenu = await $fetch<AccountMenuItem[]>(accountMenuUrl, {
      ...configuredFetchOptions,
      credentials,
    })
    const menuItems = Array.isArray(rawMenu) ? rawMenu : []

    accountMenu.value = menuItems
      .map((item): MenuLink | null => {
        const label = item.title || ''
        const rawTo = getValidTo(item.relative || item.url)

        if (!label || !rawTo) return null

        const to = normalizeAdminUrl(rawTo)

        return {
          label,
          to,
          icon: getIconForLabel(label),
          tooltip: isCompactTabs.value,
          onSelect: getAdminLinkSelectHandler(to),
        }
      })
      .filter((item): item is MenuLink => item !== null)
    isAccountMenuLoaded.value = true
  } catch (error) {
    console.error('Failed to fetch account menu:', error)
    accountMenu.value = []
  }
}

onMounted(() => {
  void loadAccountMenu()
})

watch(
  () => currentUserId.value,
  () => {
    accountMenu.value = []
    isAccountMenuLoaded.value = false
    accountMenuUserId.value = currentUserId.value
    if (hasEditorialAccess.value) {
      void loadAccountMenu()
    }
  },
)

watch(hasEditorialAccess, (hasAccess) => {
  if (hasAccess) {
    isAccountMenuLoaded.value = false
    void loadAccountMenu()
  }
})

watch(
  () => route.fullPath,
  () => {
    if (hasEditorialAccess.value && !isAccountMenuLoaded.value) {
      void loadAccountMenu()
    }
  },
)

const links = computed(() => {
  const dashboardTo = normalizeAdminUrl('/admin/content')
  const baseLinks = [
    [
      {
        label: 'Drupal CMS',
        icon: getIconForLabel('Drupal CMS'),
        to: dashboardTo,
        tooltip: isCompactTabs.value,
        onSelect: getAdminLinkSelectHandler(dashboardTo),
      },
    ],
  ]

  const tasks = editorialTaskLinks.value.length ? [editorialTaskLinks.value] : []
  const accountTo = normalizeAdminUrl('/user')
  const accountItem = accountMenu.value.length
    ? {
        label: user.value?.name || 'Account',
        icon: getIconForLabel('My account'),
        tooltip: isCompactTabs.value,
        children: accountMenu.value,
      }
    : {
        label: user.value?.name || 'Account',
        icon: getIconForLabel('My account'),
        to: accountTo,
        tooltip: isCompactTabs.value,
        onSelect: getAdminLinkSelectHandler(accountTo),
      }

  return [...baseLinks, ...tasks, [accountItem]]
})

</script>

<template>
  <UTheme :ui="adminUiTheme">
    <UNavigationMenu
      aria-label="Drupal administration"
      color="neutral"
      content-orientation="vertical"
      :items="links"
      variant="link"
    />
  </UTheme>
</template>

<style src="../../assets/css/admin-ui.css"></style>
