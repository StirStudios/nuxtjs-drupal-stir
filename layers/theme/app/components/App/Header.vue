<script lang="ts" setup>
import type { NavigationMenuItem } from '@nuxt/ui'

const props = defineProps<{ mode?: 'fixed' | 'static' }>()
const { scrollDirection, atBottom, isScrolled } = useScrollNav()
const { fetchMenu, getPage } = useDrupalCe()
const page = getPage()
const { isFront, isAdministrator } = usePageContext()
const route = useRoute()
const appConfig = useAppConfig()
const theme = appConfig.stirTheme
const hydrated = ref(false)
const forceScrolled = ref(false)
const menuContentBase = '!overflow-hidden !border-0 !bg-default !shadow-none sm:!ring-0'
const menuContent = computed(() => {
  const slideover = theme.navigation.slideover
  const angleEnabled = Boolean(slideover?.angle)

  if (!angleEnabled) return { 'aria-label': 'Site navigation menu' }

  const degRaw = Number(slideover?.angleDeg ?? 35)
  const angleDeg = Number.isFinite(degRaw) ? degRaw : 35
  const angleEdge = Math.min(48, Math.max(12, angleDeg * 0.65))

  return {
    'aria-label': 'Site navigation menu',
    class: [
      menuContentBase,
      'stir-menu-panel !divide-y-0 !ring-0 sm:!ring-0',
    ].join(' '),
    style: {
      '--stir-menu-angle-edge': `${angleEdge}%`,
    },
  }
})

// Fetch menu items
const mainMenu = await fetchMenu('main')

type MainMenuItem = {
  title?: string
  external?: boolean
  absolute?: string
  alias?: string
  relative?: string
  url?: string
  uri?: string
  children?: MainMenuItem[]
  below?: MainMenuItem[]
  items?: MainMenuItem[]
  options?: {
    fragment?: string
    attributes?: {
      target?: string
    }
  }
}

function menuChildren(item: MainMenuItem): MainMenuItem[] {
  if (Array.isArray(item.children)) return item.children
  if (Array.isArray(item.below)) return item.below
  if (Array.isArray(item.items)) return item.items

  return []
}

function normalizeInternalPath(value: string, fragment?: string) {
  const rawPath = value.replace(/^internal:/, '').replace(/^base:/, '')
  const path = !rawPath || rawPath === '<front>'
    ? '/'
    : rawPath.startsWith('/') ? rawPath : `/${rawPath}`
  const [basePath, existingFragment] = path.split('#')
  const finalFragment = existingFragment || fragment?.replace(/^#/, '').trim()

  return finalFragment ? `${basePath}#${finalFragment}` : basePath
}

function menuItemTo(item: MainMenuItem) {
  if (item.external) {
    return String(item.absolute || item.url || item.uri || '')
  }

  const value = String(item.relative || item.alias || item.uri || item.url || '')

  if (/^https?:\/\//.test(value) || value.startsWith('mailto:') || value.startsWith('tel:')) {
    return value
  }

  return normalizeInternalPath(value, item.options?.fragment)
}

function mapMenuItem(item: MainMenuItem): NavigationMenuItem {
  const children = menuChildren(item).map(mapMenuItem)
  const to = menuItemTo(item)
  const hasChildren = children.length > 0

  return {
    label: item.title ?? '',
    to: hasChildren ? undefined : to,
    target: !hasChildren && item.external ? item.options?.attributes?.target || '_blank' : undefined,
    children: hasChildren ? children : undefined,
  }
}

const navLinks = computed<NavigationMenuItem[]>(() =>
  mainMenu.value.map((item: MainMenuItem) => mapMenuItem(item)),
)

const finalIsScrolled = computed(() => {
  if (!hydrated.value) return false
  return isScrolled.value || forceScrolled.value
})

const isFixed = computed(() => {
  if (props.mode === 'fixed') return true
  return isFront.value || finalIsScrolled.value
})

const headerRootClasses = computed(() => {
  const shouldHide =
    isFixed.value &&
    ((isFront.value && !finalIsScrolled.value && theme.navigation.isHidden) ||
      (finalIsScrolled.value &&
        scrollDirection.value === 'down' &&
        !atBottom.value))

  return [
    theme.navigation.base,
    isFixed.value
      ? [
          'fixed z-50 w-full',
          isAdministrator.value && !shouldHide ? 'top-[3.1rem]' : 'top-0',
        ]
      : 'relative w-full',
    theme.navigation.transparentTop && !finalIsScrolled.value
      ? 'bg-transparent backdrop-none border-none backdrop-blur-none'
      : theme.navigation.background,
    {
      'is-scrolled': finalIsScrolled.value,
      '-translate-y-full': shouldHide,
    },
  ]
})

onMounted(() => {
  hydrated.value = true
})

watch(
  () => route.hash,
  (hash) => {
    forceScrolled.value = Boolean(hash)
  },
  { immediate: true },
)

// Fix: blur active element when slideover opens (prevents aria-hidden focus warning)
const onOpen = (val: boolean) => {
  if (val && import.meta.client)
    (document.activeElement as HTMLElement | null)?.blur()
}
</script>

<template>
  <RegionArea area="top" />
  <LazyDrupalTabs v-if="isAdministrator" />

  <UHeader
    aria-label="Site header"
    :menu="{
      side: theme.navigation.toggleDirection,
      content: menuContent as never,
    }"
    :mode="theme.navigation.toggleType"
    :title="page?.site_info?.name ?? ''"
    :to="'/'"
    :toggle-side="theme.navigation.toggleDirection"
    :ui="{
      root: headerRootClasses,
      container: theme.navigation.container,
      overlay: theme.navigation.slideover?.angle ? '!bg-transparent' : undefined,
      header: theme.navigation.header,
      body: theme.navigation.slideover.body,
      right:
        appConfig.colorMode?.forced || appConfig.colorMode?.showToggle === false
        ? 'block lg:hidden lg:flex-0'
        : 'lg:flex-1',
    }"
    @update:open="onOpen"
  >
    <template #title>
      <AppLogo
        v-if="theme.navigation.logo"
        :add-classes="
          [
            'app-logo',
            'transition-all duration-300',
            finalIsScrolled
              ? theme.navigation.logoScrolledSize || theme.navigation.logoSize
              : theme.navigation.logoSize,
          ].join(' ')
        "
      />
      <template v-else>
        {{ page?.site_info?.name }}
      </template>
    </template>

    <UNavigationMenu
      aria-label="Site Navigation"
      class="app-nav app-nav-desktop"
      :color="theme.navigation.color"
      :highlight="theme.navigation.highlight.show"
      :highlight-color="
        theme.navigation.highlight.show ? theme.navigation.highlight.color : ''
      "
      :items="navLinks"
      :variant="theme.navigation.variant"
    />

    <template v-if="appConfig.colorMode?.showToggle !== false" #right>
      <LazyIconsColorMode />
    </template>

    <template #body>
      <UNavigationMenu
        aria-label="Mobile Navigation"
        class="app-nav app-nav-mobile"
        :items="navLinks"
        orientation="vertical"
        :ui="{ link: theme.navigation.slideover.link }"
      />
    </template>
  </UHeader>
</template>
