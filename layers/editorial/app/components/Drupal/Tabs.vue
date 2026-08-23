<script setup lang="ts">
import { useMediaQuery } from '@vueuse/core'
import { getDrupalOrigin, toDrupalUrl } from '#stir/utils/drupalUrl'
import { withEditorDestination } from '#stir/utils/layoutEditLinks'
import {
  adminUiProps,
  adminUiTheme,
  type EditorialTaskLink,
  withUnpublishedTask,
} from '../../utils/adminUiTheme'

const { getPage, useMenu } = useStirDrupalCe()
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

const {
  clear: clearAccountMenu,
  data: rawAccountMenu,
  error: accountMenuError,
  execute: executeAccountMenu,
  status: accountMenuStatus,
} = useMenu('account', {
  immediate: false,
  server: false,
})
const accountMenuUserId = ref('')
const currentUserId = computed(() =>
  String(user.value?.id ?? user.value?.uid ?? 'anon'),
)
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

const accountMenu = computed<MenuLink[]>(() =>
  (Array.isArray(rawAccountMenu.value) ? rawAccountMenu.value : [])
    .map((item: AccountMenuItem): MenuLink | null => {
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
    .filter((item): item is MenuLink => item !== null),
)

const loadAccountMenu = async () => {
  if (accountMenuUserId.value !== currentUserId.value) {
    clearAccountMenu()
    accountMenuUserId.value = currentUserId.value
  }

  if (
    !hasEditorialAccess.value ||
    !isAuthenticated.value ||
    accountMenuStatus.value === 'pending' ||
    accountMenuStatus.value === 'success'
  ) {
    return
  }

  try {
    await executeAccountMenu()

    if (accountMenuError.value) {
      console.error('Failed to fetch account menu:', accountMenuError.value)
    }
  } catch (error) {
    console.error('Failed to fetch account menu:', error)
  }
}

onMounted(() => {
  void loadAccountMenu()
})

watch(
  () => currentUserId.value,
  () => {
    clearAccountMenu()
    accountMenuUserId.value = currentUserId.value
    if (hasEditorialAccess.value) {
      void loadAccountMenu()
    }
  },
)

watch(hasEditorialAccess, (hasAccess) => {
  if (hasAccess) {
    clearAccountMenu()
    void loadAccountMenu()
  }
})

// Editorial tabs persist across route changes. Retry a failed upstream menu
// request when navigation gives the user another opportunity to load it.
watch(
  () => route.fullPath,
  () => {
    if (
      hasEditorialAccess.value &&
      isAuthenticated.value &&
      accountMenuStatus.value !== 'pending' &&
      accountMenuStatus.value !== 'success'
    ) {
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

  const tasks = editorialTaskLinks.value.length
    ? [editorialTaskLinks.value]
    : []
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
  <UTheme :props="adminUiProps" :ui="adminUiTheme">
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
