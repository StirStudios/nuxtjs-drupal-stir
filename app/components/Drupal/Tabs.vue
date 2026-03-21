<script setup lang="ts">
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
type DrupalCeConfig = {
  drupalBaseUrl?: string
  ceApiEndpoint?: string
  menuEndpoint?: string
  menuBaseUrl?: string
  fetchOptions?: {
    credentials?: RequestCredentials
  }
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
      const to = getValidTo(tab.url)

      if (!to) return null

      return {
        label: tab.label,
        to,
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
    const credentials = drupalCeConfig.value.fetchOptions?.credentials || 'include'
    const rawMenu = await $fetch<AccountMenuItem[]>(accountMenuUrl, {
      credentials,
    })
    const menuItems = Array.isArray(rawMenu) ? rawMenu : []

    accountMenu.value = menuItems
      .map((item) => {
        const label = item.title || ''
        const to = getValidTo(item.relative || item.url)

        if (!label || !to) return null

        return {
          label,
          to,
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
        to: '/admin/content',
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
        to: '/user',
        tooltip: isCompactTabs.value,
      }

  return [...baseLinks, ...tasks, [accountItem]]
})

const adminTabsFontClass = 'app-admin-tabs-font'
const adminTabsSurfaceClass = '!border !border-zinc-200 !ring-0 bg-zinc-100 dark:!border-zinc-800 dark:bg-zinc-900'

const navigationUi = {
  root: `${adminTabsFontClass} sticky top-0 z-60 h-[3.5rem] w-full border-b border-zinc-200 bg-zinc-100 p-4 text-zinc-800 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100`,
  list: 'isolate',
  item: 'relative',
  link: `${adminTabsFontClass} before:bg-transparent text-sm font-medium text-zinc-700 hover:text-zinc-900 hover:before:bg-zinc-200/80 data-[state=open]:!text-amber-700 data-[state=open]:before:!bg-amber-100/70 aria-[current=page]:text-amber-700 aria-[current=page]:before:bg-amber-100/70 dark:before:bg-transparent dark:text-zinc-200 dark:hover:text-white dark:hover:before:bg-zinc-700/50 dark:data-[state=open]:!text-amber-300 dark:data-[state=open]:before:!bg-amber-400/15 dark:aria-[current=page]:text-amber-300 dark:aria-[current=page]:before:bg-amber-400/15`,
  linkLabel: 'sr-only md:not-sr-only md:block',
  linkLeadingIcon: 'text-current group-hover:!text-current group-data-[state=open]:!text-current',
  linkTrailingIcon: 'text-current group-hover:!text-current group-data-[state=open]:!text-current transition-transform duration-200',
  viewport: `${adminTabsFontClass} relative overflow-hidden rounded-md ${adminTabsSurfaceClass} shadow-md`,
  content: `${adminTabsFontClass} rounded-md ${adminTabsSurfaceClass} p-1`,
  childList: 'space-y-0.5 !ms-0 !border-0',
  childItem: '',
  childLink: `${adminTabsFontClass} p-2 text-sm text-zinc-700 hover:bg-zinc-200/80 hover:text-zinc-900 aria-[current=page]:text-amber-700 aria-[current=page]:bg-amber-50 dark:text-zinc-200 dark:hover:bg-zinc-800 dark:hover:text-white dark:aria-[current=page]:text-amber-300 dark:aria-[current=page]:bg-amber-400/10`,
  childLinkIcon: 'text-current group-hover:!text-current group-aria-[current=page]:!text-current',
  childLinkLabel: 'truncate',
}
</script>

<template>
  <UNavigationMenu
    color="neutral"
    content-orientation="vertical"
    :items="links"
    :ui="navigationUi"
    variant="link"
  />
</template>
