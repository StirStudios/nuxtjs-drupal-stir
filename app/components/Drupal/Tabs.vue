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
    highlight
    highlight-color="primary"
    :items="links"
    :ui="{
      root: 'sticky top-0 z-60 h-[3.1rem] w-full bg-zinc-200 p-4 text-zinc-800 shadow dark:bg-zinc-900 dark:text-white',
      link: 'text-xs text-default hover:before:bg-zinc-200/50 dark:hover:before:bg-zinc-900',
      linkLabel: 'hidden md:block',
      linkLeadingIcon: 'text-default',
      childLink: 'p-2 text-xs',
    }"
  />
</template>
