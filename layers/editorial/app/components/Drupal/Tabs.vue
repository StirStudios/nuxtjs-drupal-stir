<script setup lang="ts">
import { loadIcons } from '@iconify/vue'
import { useMediaQuery } from '@vueuse/core'
import type {
  StirDrupalLocalTask,
  StirDrupalLocalTasks,
} from '#stir/types'
import { getDrupalOrigin, toDrupalUrl } from '#stir/utils/drupalUrl'
import { withEditorDestination } from '#stir/utils/layoutEditLinks'
import {
  STIR_EDITORIAL_OFFSET,
  STIR_EDITORIAL_OFFSET_VAR,
} from '#stir/utils/editorialOffset'
import {
  ADMIN_TAB_ICONS,
  adminUiProps,
  adminUiTheme,
  type EditorialTaskLink,
  adminLinkIcon,
  toIconifyName,
  withUnpublishedTask,
} from '../../utils/adminUiTheme'

const { getPage, useMenu } = useStirDrupalCe()

useAdminUiStyles()
// Only editors load this component, so its icons stay out of the shared
// bundle. Fetch the whole set in one request up front: a tab icon then
// renders at once, instead of popping in as each first appears.
onMounted(() => loadIcons(ADMIN_TAB_ICONS.map(toIconifyName)))
const page = getPage()
const route = useRoute()
const requestUrl = useRequestURL()
const config = useRuntimeConfig()

// Publish the space this bar occupies so the theme can offset itself without
// knowing the editorial layer exists. Nuxt renders it during SSR, so the
// header is never offset a frame late, and removes it when the bar unmounts.
useHead({
  style: [{
    id: 'stir-editorial-offset',
    innerHTML: `:root{${STIR_EDITORIAL_OFFSET_VAR}:${STIR_EDITORIAL_OFFSET};}`,
  }],
})

const user = computed(() => page.value?.current_user || null)
const { adminDashboardUrl, hasEditorialAccess, isAuthenticated } = usePageContext()

type LocalTask = StirDrupalLocalTask
type LocalTasks = StirDrupalLocalTasks
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
  const localTasks = page.value?.local_tasks

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
        // The active task on a frontend page is Drupal's View tab.
        icon: tab.active === true ? 'i-lucide-eye' : adminLinkIcon(to),
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
        icon: adminLinkIcon(to),
        tooltip: isCompactTabs.value,
        onSelect: getAdminLinkSelectHandler(to),
      }
    })
    .filter((item): item is MenuLink => item !== null),
)

// One request per editor: the key changes when Drupal's answer about who is
// looking changes, and nothing else re-fetches a menu already in hand.
const accountMenuKey = computed(() =>
  hasEditorialAccess.value && isAuthenticated.value ? currentUserId.value : '',
)

const loadAccountMenu = async () => {
  if (
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

watch(
  accountMenuKey,
  (key, previousKey) => {
    if (key !== previousKey) clearAccountMenu()
    if (key) void loadAccountMenu()
  },
  { immediate: import.meta.client },
)

// Editorial tabs persist across route changes. Retry a failed upstream menu
// request when navigation gives the user another opportunity to load it.
watch(
  () => route.fullPath,
  () => {
    if (accountMenuKey.value) void loadAccountMenu()
  },
)

const links = computed(() => {
  const dashboard = adminDashboardUrl.value
  // Drupal names the dashboard it allows; without one there is no item.
  const baseLinks = dashboard
    ? [
        [
          {
            label: 'Drupal CMS',
            icon: 'i-lucide-layout-dashboard',
            to: normalizeAdminUrl(dashboard),
            tooltip: isCompactTabs.value,
            onSelect: getAdminLinkSelectHandler(normalizeAdminUrl(dashboard)),
          },
        ],
      ]
    : []

  const tasks = editorialTaskLinks.value.length
    ? [editorialTaskLinks.value]
    : []
  const accountTo = normalizeAdminUrl('/user')
  const accountItem = accountMenu.value.length
    ? {
        label: user.value?.name || 'Account',
        icon: 'i-lucide-circle-user',
        tooltip: isCompactTabs.value,
        children: accountMenu.value,
      }
    : {
        label: user.value?.name || 'Account',
        icon: 'i-lucide-circle-user',
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
