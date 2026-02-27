<script setup lang="ts">
import { usePageContext } from '~/composables/usePageContext'

const { getDrupalBaseUrl, fetchMenu } = useDrupalCe()
const { page } = usePageContext()
const drupalBaseUrl = getDrupalBaseUrl()
const user = computed(() => page.value?.current_user || null)
const isAdministrator = computed(
  () => !!user.value?.roles?.includes('administrator'),
)

const iconMap: Record<string, string> = {
  'Drupal CMS': 'i-lucide-home',
  Settings: 'i-lucide-settings',
  View: 'i-lucide-eye',
  Edit: 'i-lucide-pencil',
  Delete: 'i-lucide-trash-2',
  Revisions: 'i-lucide-copy',
  Export: 'i-lucide-upload',
  API: 'i-lucide-code',
  'Log out': 'i-lucide-log-out',
  'Log in': 'i-lucide-log-in',
  'My account': 'i-lucide-user',
}

const getIconForLabel = (label: string): string | null => {
  return iconMap[label] || null
}

type LocalTask = { label: string; url: string }
type LocalTasks = { primary: LocalTask[]; secondary: LocalTask[] }
type MenuLink = { label: string; to: string; icon: string | null }
type AccountMenuItem = { title?: string; relative?: string; url?: string }

const getValidTo = (value: unknown): string | null => {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()

  return trimmed.length ? trimmed : null
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
      }
    })
    .filter((tab): tab is MenuLink => tab !== null),
)

const accountMenu = ref<MenuLink[]>([])
const isAccountMenuLoaded = ref(false)

const loadAccountMenu = async () => {
  if (!isAdministrator.value || isAccountMenuLoaded.value) return

  try {
    const rawMenu = await fetchMenu('account')
    const menuItems = Array.isArray(rawMenu.value)
      ? (rawMenu.value as AccountMenuItem[])
      : []

    accountMenu.value = menuItems
      .map((item) => {
        const label = item.title || ''
        const to = getValidTo(item.relative || item.url)

        if (!label || !to) return null

        return {
          label,
          to,
          icon: getIconForLabel(label),
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

watch(isAdministrator, (isAdmin) => {
  if (isAdmin) void loadAccountMenu()
})

const links = computed(() => {
  const baseLinks = [
    [
      {
        label: 'Drupal CMS',
        icon: getIconForLabel('Drupal CMS'),
        to: `${drupalBaseUrl}/admin/content`,
        target: '_self',
      },
    ],
  ]

  const tasks = localTaskLinks.value.length ? [localTaskLinks.value] : []
  const accountItem = accountMenu.value.length
    ? {
        label: user.value?.name || 'Account',
        icon: getIconForLabel('My account'),
        children: accountMenu.value,
      }
    : {
        label: user.value?.name || 'Account',
        icon: getIconForLabel('My account'),
        to: `${drupalBaseUrl}/user`,
        target: '_self',
      }

  return [...baseLinks, ...tasks, [accountItem]]
})
</script>

<template>
  <UNavigationMenu
    color="neutral"
    content-orientation="vertical"
    :items="links"
    :ui="{
      root: 'sticky top-0 z-60 h-[3.1rem] w-full border-b border-zinc-200 bg-zinc-100 p-4 text-zinc-800 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100',
      list: 'isolate',
      item: 'relative',
      link: 'before:bg-transparent text-xs text-zinc-700 hover:text-zinc-900 hover:before:bg-zinc-200/80 data-[state=open]:!text-amber-700 data-[state=open]:before:!bg-amber-100/70 aria-[current=page]:text-amber-700 aria-[current=page]:before:bg-amber-100/70 dark:before:bg-transparent dark:text-zinc-200 dark:hover:text-white dark:hover:before:bg-zinc-700/50 dark:data-[state=open]:!text-amber-300 dark:data-[state=open]:before:!bg-amber-400/15 dark:aria-[current=page]:text-amber-300 dark:aria-[current=page]:before:bg-amber-400/15',
      linkLabel: 'hidden md:block',
      linkLeadingIcon: 'text-current group-hover:!text-current group-data-[state=open]:!text-current',
      linkTrailingIcon: 'text-current group-hover:!text-current group-data-[state=open]:!text-current transition-transform duration-200',
      viewport:
        'relative overflow-hidden rounded-md !border !border-zinc-200 !ring-0 bg-zinc-100 shadow-md dark:!border-zinc-800 dark:bg-zinc-900',
      content:
        'rounded-md !border !border-zinc-200 !ring-0 bg-zinc-100 p-1 dark:!border-zinc-800 dark:bg-zinc-900',
      childList: 'space-y-0.5 !ms-0 !border-0',
      childItem: '',
      childLink:
        'p-2 text-xs text-zinc-700 hover:bg-zinc-200/80 hover:text-zinc-900 aria-[current=page]:text-amber-700 aria-[current=page]:bg-amber-50 dark:text-zinc-200 dark:hover:bg-zinc-800 dark:hover:text-white dark:aria-[current=page]:text-amber-300 dark:aria-[current=page]:bg-amber-400/10',
      childLinkIcon: 'text-current group-hover:!text-current group-aria-[current=page]:!text-current',
      childLinkLabel: 'truncate',
    }"
    variant="link"
  />
</template>
