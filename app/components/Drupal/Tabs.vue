<script setup lang="ts">
import { getDrupalOrigin, toDrupalUrl } from '~/utils/drupalUrl'
import { adminUiTheme } from '~/utils/adminUiTheme'

const { getPage } = useDrupalCe()
const page = getPage()
const route = useRoute()
const config = useRuntimeConfig()
const user = computed(() => page.value?.current_user || null)
const isAdministrator = computed(
  () => !!user.value?.roles?.includes('administrator'),
)

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

type LocalTask = { label: string; url: string }
type LocalTasks = { primary: LocalTask[]; secondary: LocalTask[] }
type MenuLink = {
  label: string
  to: string
  icon: string | null
  tooltip: boolean
}
type AccountMenuItem = { title?: string; relative?: string; url?: string }
type AccountMenuFetchOptions = NonNullable<Parameters<typeof $fetch<AccountMenuItem[]>>[1]>
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

const isCompactTabs = ref(false)

const updateCompactTabs = () => {
  if (import.meta.client === false) return

  isCompactTabs.value = window.matchMedia('(max-width: 767px)').matches
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
    .map((tab: LocalTask) => {
      const rawTo = getValidTo(tab.url)

      if (!rawTo) return null

      return {
        label: tab.label,
        to: normalizeAdminUrl(rawTo),
        icon: getIconForLabel(tab.label),
        tooltip: isCompactTabs.value,
      }
    })
    .filter((tab): tab is MenuLink => tab !== null),
)

const accountMenu = useState<MenuLink[]>('drupal-tabs-account-menu', () => [])
const isAccountMenuLoaded = useState<boolean>('drupal-tabs-account-menu-loaded', () => false)
const accountMenuUserId = useState<string>('drupal-tabs-account-menu-user-id', () => '')
const currentUserId = computed(() => String(user.value?.id ?? 'anon'))
const drupalCeConfig = computed<DrupalCeConfig>(() => {
  return (config.public.drupalCe || {}) as DrupalCeConfig
})
const drupalOrigin = computed(() => getDrupalOrigin(config.public))

const normalizeAdminUrl = (value: string): string => {
  return toDrupalUrl(value, drupalOrigin.value)
}

const getAccountMenuUrl = (): string => {
  const menuBaseUrl = String(drupalCeConfig.value.menuBaseUrl || '').replace(/\/$/, '')
  const drupalBaseUrl = String(drupalCeConfig.value.drupalBaseUrl || '').replace(/\/$/, '')
  const ceApiEndpoint = String(drupalCeConfig.value.ceApiEndpoint || '/ce-api')
  const normalizedCeApiEndpoint = ceApiEndpoint.startsWith('/') ? ceApiEndpoint : `/${ceApiEndpoint}`
  const menuEndpoint = String(drupalCeConfig.value.menuEndpoint || 'api/menu_items/$$$NAME$$$')
  const menuPath = menuEndpoint.replace('$$$NAME$$$', 'account').replace(/^\/+/, '')
  const baseUrl = menuBaseUrl || `${drupalBaseUrl}${normalizedCeApiEndpoint}`

  return `${baseUrl}/${menuPath}`
}

const loadAccountMenu = async () => {
  if (accountMenuUserId.value !== currentUserId.value) {
    accountMenu.value = []
    isAccountMenuLoaded.value = false
    accountMenuUserId.value = currentUserId.value
  }

  if (!isAdministrator.value || isAccountMenuLoaded.value) {
    return
  }

  try {
    const accountMenuUrl = getAccountMenuUrl()
    const configuredFetchOptions = (drupalCeConfig.value.fetchOptions || {}) as AccountMenuFetchOptions
    const credentials = drupalCeConfig.value.fetchOptions?.credentials || 'include'
    const rawMenu = await $fetch<AccountMenuItem[]>(accountMenuUrl, {
      ...configuredFetchOptions,
      credentials,
    })
    const menuItems = Array.isArray(rawMenu) ? rawMenu : []

    accountMenu.value = menuItems
      .map((item) => {
        const label = item.title || ''
        const rawTo = getValidTo(item.relative || item.url)

        if (!label || !rawTo) return null

        return {
          label,
          to: normalizeAdminUrl(rawTo),
          icon: getIconForLabel(label),
          tooltip: isCompactTabs.value,
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
  updateCompactTabs()
  window.addEventListener('resize', updateCompactTabs)
  void loadAccountMenu()
})

onBeforeUnmount(() => {
  if (import.meta.client === false) return

  window.removeEventListener('resize', updateCompactTabs)
})

watch(
  () => currentUserId.value,
  () => {
    accountMenu.value = []
    isAccountMenuLoaded.value = false
    accountMenuUserId.value = currentUserId.value
    if (isAdministrator.value) {
      void loadAccountMenu()
    }
  },
)

watch(isAdministrator, (isAdmin) => {
  if (isAdmin) {
    isAccountMenuLoaded.value = false
    void loadAccountMenu()
  }
})

watch(() => route.fullPath, () => {
  if (isAdministrator.value && !isAccountMenuLoaded.value) {
    void loadAccountMenu()
  }
})

const links = computed(() => {
  const baseLinks = [
    [
      {
        label: 'Drupal CMS',
        icon: getIconForLabel('Drupal CMS'),
        to: normalizeAdminUrl('/admin/content'),
        tooltip: isCompactTabs.value,
      },
    ],
  ]

  const tasks = localTaskLinks.value.length ? [localTaskLinks.value] : []
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
        to: normalizeAdminUrl('/user'),
        tooltip: isCompactTabs.value,
      }

  return [...baseLinks, ...tasks, [accountItem]]
})

const adminTabsFontClass = 'app-admin-tabs-font'
const adminTabsSurfaceClass = 'admin-ui-nav-surface'

const navigationUi = {
  root: `admin-ui admin-ui-scope admin-ui-nav-root ${adminTabsFontClass} sticky top-0 z-60 h-[3.5rem] w-full p-4`,
  list: 'isolate',
  item: 'relative',
  link: `${adminTabsFontClass} admin-ui-nav-link before:bg-transparent text-sm font-medium dark:before:bg-transparent`,
  linkLabel: 'sr-only md:not-sr-only md:block',
  linkLeadingIcon: 'text-current group-hover:!text-current group-data-[state=open]:!text-current',
  linkTrailingIcon: 'text-current group-hover:!text-current group-data-[state=open]:!text-current transition-transform duration-200',
  viewport: `${adminTabsFontClass} relative overflow-hidden rounded-md ${adminTabsSurfaceClass} shadow-md`,
  content: `${adminTabsFontClass} rounded-md ${adminTabsSurfaceClass} p-1`,
  childList: 'space-y-0.5 !ms-0 !border-0',
  childItem: '',
  childLink: `${adminTabsFontClass} admin-ui-nav-child-link`,
  childLinkIcon: 'text-current group-hover:!text-current group-aria-[current=page]:!text-current',
  childLinkLabel: 'truncate',
}

</script>

<template>
  <UTheme :ui="adminUiTheme">
    <UNavigationMenu
      color="neutral"
      content-orientation="vertical"
      :items="links"
      :ui="navigationUi"
      variant="link"
    />
  </UTheme>
</template>
