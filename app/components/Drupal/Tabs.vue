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
    content-orientation="vertical"
    :items="links"
    :ui="{
      root: 'sticky top-0 z-60 h-[3.1rem] w-full border-b border-zinc-200 bg-zinc-100 p-4 text-zinc-800 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100',
      link: 'text-xs text-zinc-700 hover:text-zinc-900 hover:before:bg-sky-100/80 aria-[current=page]:text-sky-700 dark:text-zinc-200 dark:hover:text-white dark:hover:before:bg-sky-400/20 dark:aria-[current=page]:text-sky-300',
      linkLabel: 'hidden md:block',
      linkLeadingIcon: 'text-zinc-500 dark:text-zinc-300',
      childLink:
        'p-2 text-xs text-zinc-700 hover:bg-sky-50 hover:text-zinc-900 aria-[current=page]:text-sky-700 dark:text-zinc-200 dark:hover:bg-sky-400/20 dark:hover:text-white dark:aria-[current=page]:text-sky-300',
    }"
  />
</template>
