<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import type { AdminMenuResponse } from '../../../shared/types/adminMenu'

type ResolvedLink = { to: string; onSelect?: (event: Event) => void }

const props = defineProps<{
  // One key per editor, so an account switch loads its own menu.
  userKey: string
  // The editor bar's own link handling: Drupal URL plus return destination.
  resolveLink: (url: string) => ResolvedLink
}>()

const open = defineModel<boolean>('open', { default: false })

// Section icons keyed by Drupal's admin paths, which do not change with the
// site language.
const SECTION_ICONS: ReadonlyArray<readonly [RegExp, string]> = [
  [/\/admin\/dashboard$/, 'i-lucide-layout-dashboard'],
  [/\/admin\/content$/, 'i-lucide-file-text'],
  [/\/admin\/structure$/, 'i-lucide-blocks'],
  [/\/admin\/appearance$/, 'i-lucide-palette'],
  [/\/admin\/modules$/, 'i-lucide-puzzle'],
  [/\/admin\/config$/, 'i-lucide-settings'],
  [/\/admin\/people$/, 'i-lucide-users'],
  [/\/admin\/reports$/, 'i-lucide-chart-line'],
]

const sectionIcon = (url: string): string =>
  SECTION_ICONS.find(([pattern]) => pattern.test(url))?.[1] ?? 'i-lucide-folder'

const { data, error, status, execute } = useFetch<AdminMenuResponse>(
  '/api/admin-menu',
  {
    key: computed(() => `editorial-admin-menu--${props.userKey}`),
    immediate: false,
    server: false,
  },
)

// The panel opens from a bar item, not a dialog trigger, so it remembers what
// had focus and returns it there on close.
let returnFocus: HTMLElement | null = null

// Loaded the first time the panel opens, never for editors who do not open it.
watch(open, (isOpen) => {
  if (!isOpen) return
  returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
  if (status.value === 'idle') void execute()
})

const content = {
  onCloseAutoFocus: (event: Event) => {
    event.preventDefault()
    returnFocus?.focus()
  },
}

const items = computed<NavigationMenuItem[]>(() =>
  (data.value?.sections ?? []).map((section) => {
    const sectionLink = props.resolveLink(section.url)

    if (!section.children.length) {
      return { label: section.title, icon: sectionIcon(section.url), ...sectionLink }
    }

    return {
      label: section.title,
      icon: sectionIcon(section.url),
      children: [
        { label: `All ${section.title.toLowerCase()}`, ...sectionLink },
        ...section.children.map((child) => ({
          label: child.title,
          description: child.description || undefined,
          ...props.resolveLink(child.url),
        })),
      ],
    }
  }),
)
</script>

<template>
  <USlideover
    v-model:open="open"
    :content="content"
    description="Each link opens in Drupal CMS."
    side="left"
    title="Drupal administration"
  >
    <template #body>
      <p v-if="status === 'pending'" class="text-sm text-muted" role="status">
        Loading the administration menu…
      </p>
      <p v-else-if="error" class="text-sm text-error" role="alert">
        The administration menu could not be loaded.
      </p>
      <UNavigationMenu
        v-else
        aria-label="Drupal administration sections"
        :items="items"
        orientation="vertical"
        type="single"
      />
    </template>
  </USlideover>
</template>
