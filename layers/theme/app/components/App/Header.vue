<script lang="ts" setup>
import type {
  UNavigationMenu as UNavigationMenuComponent,
} from '#components'
import type { NavigationMenuItem } from '@nuxt/ui'
import {
  menuItemTo,
  type DrupalMenuItemLink,
} from '~/utils/navigation'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<{ mode?: 'fixed' | 'static' }>()
const attrs = useAttrs()
const { scrollDirection, atBottom, isScrolled } = useScrollNav()
const { fetchMenu, getPage } = useDrupalCe()
const page = getPage()
const { isFront, isAdministrator } = usePageContext()
const route = useRoute()
const appConfig = useAppConfig()
const theme = appConfig.stirTheme
const hydrated = ref(false)
const forceScrolled = ref(false)
const menuOpen = ref(false)
const menuMounted = ref(false)
const menuId = useId()
const menuContentBase = '!overflow-hidden !border-0 !bg-default !shadow-none sm:!ring-0'
const headerUi = {
  container: 'flex items-center justify-between gap-3',
  left: 'lg:flex-1 flex items-center gap-1.5',
  center: 'hidden lg:flex',
  right: 'flex items-center justify-end lg:flex-1 gap-1.5',
  title: 'shrink-0 font-bold text-xl text-highlighted flex items-end gap-1.5',
  toggle: 'lg:hidden',
  content: 'lg:hidden',
  overlay: 'lg:hidden',
  header: 'shrink-0 flex items-center justify-between gap-3',
  body: 'p-4 sm:p-6 overflow-y-auto',
} as const

type ToggleDirection = 'left' | 'right' | 'top' | 'bottom'
type HeaderToggleSide = 'left' | 'right'
type ComponentProps<T> = T extends new () => { $props: infer P } ? P : never
type NavigationMenuProps = ComponentProps<typeof UNavigationMenuComponent>
type NavigationMenuColor = Extract<NonNullable<NavigationMenuProps['color']>, string>
type NavigationMenuVariant = Extract<NonNullable<NavigationMenuProps['variant']>, string>

type MainMenuItem = DrupalMenuItemLink & {
  title?: string
  children?: MainMenuItem[]
  below?: MainMenuItem[]
  items?: MainMenuItem[]
  options?: DrupalMenuItemLink['options'] & {
    attributes?: {
      target?: string
    }
  }
}

const toToggleDirection = (value: unknown): ToggleDirection => {
  return value === 'left' || value === 'right' || value === 'top' || value === 'bottom'
    ? value
    : 'right'
}
const toHeaderToggleSide = (value: unknown): HeaderToggleSide => (value === 'left' ? 'left' : 'right')

const toStringProp = <T extends string>(value: unknown): T | undefined =>
  typeof value === 'string' && value.trim() ? value.trim() as T : undefined

const toNavigationColor = (value: unknown): NavigationMenuColor | undefined =>
  toStringProp<NavigationMenuColor>(value)

const toNavigationVariant = (value: unknown): NavigationMenuVariant | undefined =>
  toStringProp<NavigationMenuVariant>(value)

const toClassName = (value: unknown): string => {
  if (!value) return ''
  if (typeof value === 'string') return value.trim()

  if (Array.isArray(value)) {
    return value
      .map((entry) => toClassName(entry))
      .filter(Boolean)
      .join(' ')
  }

  return ''
}

const menuSide = computed(() => toToggleDirection(theme.navigation?.toggleDirection))
const menuToggleSide = computed(() => toHeaderToggleSide(menuSide.value))
const headerNavColor = computed(() => toNavigationColor(theme.navigation?.color))
const headerHighlightColor = computed(() =>
  theme.navigation?.highlight?.show ? toNavigationColor(theme.navigation.highlight?.color) : undefined,
)
const headerNavVariant = computed(() => toNavigationVariant(theme.navigation?.variant))
const siteTitle = computed(() => page.value?.site_info?.name ?? '')
const showColorModeToggle = computed(() => appConfig.colorMode?.showToggle !== false)
const finalIsScrolled = computed(() => {
  if (!hydrated.value) return false
  return isScrolled.value || forceScrolled.value
})
const isFixed = computed(() => {
  if (props.mode === 'fixed') return true
  return isFront.value || finalIsScrolled.value
})
const shouldHide = computed(() =>
  isFixed.value &&
  ((isFront.value && !finalIsScrolled.value && theme.navigation.isHidden) ||
    (finalIsScrolled.value &&
      scrollDirection.value === 'down' &&
      !atBottom.value)),
)
const headerClasses = computed(() =>
  [
    'stir-header transition-all',
    toClassName(theme.navigation.base),
    isFixed.value
      ? `fixed z-50 w-full ${isAdministrator.value && !shouldHide.value ? 'top-[3.1rem]' : 'top-0'}`
      : 'relative w-full',
    toClassName(
      theme.navigation.transparentTop && !finalIsScrolled.value
        ? 'bg-transparent backdrop-none border-none backdrop-blur-none'
        : theme.navigation.background,
    ),
    finalIsScrolled.value ? 'is-scrolled stir-header--scrolled' : '',
    shouldHide.value ? '-translate-y-full' : '',
  ].filter(Boolean).join(' '),
)
const headerContainerClasses = computed(() =>
  [
    headerUi.container,
    toClassName(theme.navigation.container),
  ].filter(Boolean).join(' '),
)
const logoClasses = computed(() =>
  [
    'app-logo',
    'transition-all duration-300',
    finalIsScrolled.value
      ? theme.navigation.logoScrolledSize || theme.navigation.logoSize
      : theme.navigation.logoSize,
  ].join(' '),
)
const menuContent = computed(() => {
  const slideover = theme.navigation.slideover
  const angleEnabled = Boolean(slideover?.angle)

  if (!angleEnabled) {
    return {
      id: menuId,
      'aria-label': 'Site navigation menu',
    }
  }

  const degRaw = Number(slideover?.angleDeg ?? 35)
  const angleDeg = Number.isFinite(degRaw) ? degRaw : 35
  const angleEdge = Math.min(48, Math.max(12, angleDeg * 0.65))

  return {
    id: menuId,
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
const menuOverlayClasses = computed(() =>
  [
    headerUi.overlay,
    theme.navigation.slideover?.angle ? '!bg-transparent' : '',
  ].filter(Boolean).join(' '),
)
const menuContentClasses = computed(() => headerUi.content)
const menuHeaderClasses = computed(() =>
  [
    headerUi.header,
    toClassName(theme.navigation.header),
  ].filter(Boolean).join(' '),
)
const menuBodyClasses = computed(() =>
  [
    headerUi.body,
    toClassName(theme.navigation.slideover?.body),
  ].filter(Boolean).join(' '),
)
const headerRightClasses = computed(() =>
  [
    headerUi.right,
    appConfig.colorMode?.forced || appConfig.colorMode?.showToggle === false
      ? 'block lg:hidden lg:flex-0'
      : 'lg:flex-1',
  ].filter(Boolean).join(' '),
)
const toggleClasses = computed(() =>
  [
    headerUi.toggle,
    menuToggleSide.value === 'left' ? '-ms-1.5' : '-me-1.5',
  ].join(' '),
)
const toggleIcon = computed(() => {
  const icons = (appConfig.ui as { icons?: Partial<Record<'close' | 'menu', string>> } | undefined)?.icons

  return menuOpen.value ? icons?.close || 'i-lucide-x' : icons?.menu || 'i-lucide-menu'
})

const mainMenu = await fetchMenu('main')

function menuChildren(item: MainMenuItem): MainMenuItem[] {
  if (Array.isArray(item.children)) return item.children
  if (Array.isArray(item.below)) return item.below
  if (Array.isArray(item.items)) return item.items

  return []
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

function toggleMenu() {
  if (menuOpen.value) {
    menuOpen.value = false
    return
  }

  menuMounted.value = true
  menuOpen.value = true
}

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

watch(
  () => route.fullPath,
  () => {
    menuOpen.value = false
  },
)

watch(menuOpen, (val) => {
  if (val && import.meta.client)
    (document.activeElement as HTMLElement | null)?.blur()
})
</script>

<template>
  <LazyRegionArea area="top" />
  <LazyDrupalTabs v-if="isAdministrator" />

  <header
    v-bind="attrs"
    aria-label="Site header"
    :class="headerClasses"
    data-slot="root"
  >
    <UContainer
      :class="headerContainerClasses"
      data-slot="container"
    >
      <div
        :class="headerUi.left"
        data-slot="left"
      >
        <UButton
          v-if="menuToggleSide === 'left'"
          :aria-controls="menuId"
          :aria-expanded="menuOpen"
          :aria-label="menuOpen ? 'Close navigation menu' : 'Open navigation menu'"
          :class="toggleClasses"
          color="neutral"
          data-slot="toggle"
          :icon="toggleIcon"
          variant="ghost"
          @click="toggleMenu"
        />

        <ULink
          aria-label="Home"
          :class="headerUi.title"
          data-slot="title"
          to="/"
        >
          <AppLogo
            v-if="theme.navigation.logo"
            :add-classes="logoClasses"
          />
          <template v-else>
            {{ siteTitle }}
          </template>
        </ULink>
      </div>

      <div
        :class="headerUi.center"
        data-slot="center"
      >
        <LazyUNavigationMenu
          aria-label="Site Navigation"
          class="app-nav app-nav-desktop"
          :color="headerNavColor"
          :highlight="theme.navigation.highlight.show"
          :highlight-color="headerHighlightColor"
          :items="navLinks"
          :variant="headerNavVariant"
        />
      </div>

      <div
        :class="headerRightClasses"
        data-slot="right"
      >
        <LazyIconsColorMode v-if="showColorModeToggle" />

        <UButton
          v-if="menuToggleSide === 'right'"
          :aria-controls="menuId"
          :aria-expanded="menuOpen"
          :aria-label="menuOpen ? 'Close navigation menu' : 'Open navigation menu'"
          :class="toggleClasses"
          color="neutral"
          data-slot="toggle"
          :icon="toggleIcon"
          variant="ghost"
          @click="toggleMenu"
        />
      </div>
    </UContainer>
  </header>

  <LazyUSlideover
    v-if="menuMounted"
    v-model:open="menuOpen"
    :content="menuContent as never"
    description="Site navigation"
    :side="menuSide"
    title="Navigation"
    :ui="{
      overlay: menuOverlayClasses,
      content: menuContentClasses,
    }"
  >
    <template #content>
      <LazyAppHeaderOverlayHeader
        :header-class="menuHeaderClasses"
        :left-class="headerUi.left"
        :logo-classes="logoClasses"
        :menu-id="menuId"
        :right-class="headerRightClasses"
        :show-color-mode-toggle="showColorModeToggle"
        :show-logo="Boolean(theme.navigation.logo)"
        :site-title="siteTitle"
        :title-class="headerUi.title"
        :toggle-class="toggleClasses"
        :toggle-icon="toggleIcon"
        @close="menuOpen = false"
      />

      <LazyAppHeaderMobileMenu
        :body-class="menuBodyClasses"
        :items="navLinks"
        :link-class="theme.navigation.slideover.link"
      />
    </template>
  </LazyUSlideover>
</template>
