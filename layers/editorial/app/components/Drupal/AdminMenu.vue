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

// The panel is teleported out of the tabs, so it carries the admin scope
// itself: the layer's fixed palette and font, whatever the site's theme.
useAdminUiStyles()

const panelUi = {
  overlay: 'admin-ui-modal-overlay',
  content: 'admin-ui admin-ui-scope admin-ui-modal admin-ui-panel max-w-64 border-y-0 border-s-0',
  header: 'min-h-0 px-4 py-3 sm:px-4',
  title: 'admin-ui-modal-title',
  description: 'sr-only',
  body: 'p-2 sm:p-2',
  // Centred on the compact header's title line.
  close: 'top-2 end-2',
}
const menuUi = {
  link: 'app-admin-tabs-font admin-ui-nav-link text-sm font-medium',
  linkLeadingIcon: 'text-current',
  childList: 'ms-4',
  childLink: 'app-admin-tabs-font admin-ui-nav-child-link',
}

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

// Shift+Alt+D toggles the panel from anywhere except a text field; browsers
// such as Zen take Alt+D.
defineShortcuts({
  shift_alt_d: () => {
    open.value = !open.value
  },
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
    description="Drupal's administration sections. Each link opens in Drupal. Shift+Alt+D opens and closes this panel."
    side="left"
    title="Drupal CMS"
    :ui="panelUi"
  >
    <template #body>
      <p v-if="status === 'pending'" class="px-2 text-sm text-muted" role="status">
        Loading the administration menu…
      </p>
      <p v-else-if="error" class="px-2 text-sm text-error" role="alert">
        The administration menu could not be loaded.
      </p>
      <UNavigationMenu
        v-else
        aria-label="Drupal administration sections"
        :items="items"
        orientation="vertical"
        type="single"
        :ui="menuUi"
      />
    </template>
  </USlideover>
</template>
