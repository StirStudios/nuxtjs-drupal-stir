<script lang="ts" setup>
import type {
  USlideover as USlideoverComponent,
  UNavigationMenu as UNavigationMenuComponent,
} from '#components'
import type { NavigationMenuItem } from '@nuxt/ui'
import { createReusableTemplate, useEventListener } from '@vueuse/core'
import {
  extractHeaderActions,
  mapDrupalMenuItem,
  splitMenuAtMarker,
  type DrupalMenuTreeItem,
} from '#stir/utils/navigation'
import {
  headerClassName,
  headerConfigString,
  headerDesktopLayout,
  headerLogoSurface,
  headerMenuAngleStyle,
  headerToggleDirection,
  joinHeaderClasses,
} from '#stir/utils/headerTheme'

defineOptions({
  inheritAttrs: false,
})

type HeaderMode = 'fixed' | 'sticky'

const props = defineProps<{ mode?: HeaderMode }>()
const attrs = useAttrs()
const { scrollDirection, atBottom, isScrolled } = useScrollNav()
const { getPage, useMenu } = useStirDrupalCe()
const page = getPage()
const { isFront, hasEditorialAccess } = usePageContext()
const route = useRoute()
const nuxtApp = useNuxtApp()
const appConfig = useAppConfig()
const theme = appConfig.stirTheme
const hydrated = ref(false)
const forceScrolled = ref(false)
const menuOpen = ref(false)
// A menu kept mounted while hidden is rendered up front so its links are in
// the server HTML.
const menuMounted = ref(theme.navigation.slideover?.unmountOnHide === false)
const menuId = useId()
const [DefineMenuToggle, ReuseMenuToggle] = createReusableTemplate()
const headerUi = {
  container: 'flex items-center justify-between gap-3',
  left: 'lg:flex-1 flex items-center gap-1.5',
  center: 'hidden lg:flex',
  right: 'flex items-center justify-end lg:flex-1 gap-1.5',
  // The slideover's own close region; header-only responsive classes, such as
  // hiding the right region from lg up, must not hide its close button.
  overlayRight: 'flex items-center justify-end gap-1.5',
  title: 'shrink-0 font-bold text-xl text-highlighted flex items-end gap-1.5',
  toggle: 'size-11 justify-center p-0',
  content: 'sm:max-w-md',
  header: 'flex min-h-(--ui-header-height) shrink-0 items-center justify-between gap-3 px-4 py-3 sm:px-6',
  body: 'flex-1 overflow-y-auto px-4 py-6 sm:px-6',
} as const
const centeredToggleUi = {
  container: 'grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3',
  left: 'flex items-center justify-self-start gap-1.5',
  center: 'flex items-center justify-center',
  right: 'flex items-center justify-self-end justify-end gap-1.5',
} as const

type ComponentProps<T> = T extends new () => { $props: infer P } ? P : never
type NavigationMenuProps = ComponentProps<typeof UNavigationMenuComponent>
type NavigationMenuColor = Extract<NonNullable<NavigationMenuProps['color']>, string>
type NavigationMenuVariant = Extract<NonNullable<NavigationMenuProps['variant']>, string>
type SlideoverContent = NonNullable<ComponentProps<typeof USlideoverComponent>['content']>
type SlideoverContentAttrs = SlideoverContent & {
  'aria-label'?: string
  id?: string
  style?: Record<`--${string}`, string>
}

const toRegisteredComponent = (value: unknown) => {
  const name = headerConfigString<string>(value)

  return name ? nuxtApp.vueApp.component(name) ?? null : null
}

const menuSide = computed(() => headerToggleDirection(theme.navigation?.toggleDirection))
const menuToggleSide = computed(() => (menuSide.value === 'left' ? 'left' : 'right'))
const desktopHeaderLayout = computed(() => headerDesktopLayout(theme.navigation?.desktopLayout))
const isSplitLogoLayout = computed(() => desktopHeaderLayout.value === 'split-logo')
const isCenteredToggleLayout = computed(() => desktopHeaderLayout.value === 'centered-toggle')
const isToggleLayout = computed(() => desktopHeaderLayout.value === 'toggle')
// Toggle layouts make the menu toggle the only navigation at every breakpoint.
const mobileOnlyClass = computed(() => isCenteredToggleLayout.value || isToggleLayout.value ? '' : 'lg:hidden')
const showBrand = computed(() => theme.navigation.brand !== false)
// Shared by every desktop menu the header renders.
const navProps = computed(() => {
  const navigation = theme.navigation
  const highlight = Boolean(navigation.highlight?.show)

  return {
    color: headerConfigString<NavigationMenuColor>(navigation.color),
    contentOrientation: navigation.contentOrientation === 'vertical' ? 'vertical' as const : 'horizontal' as const,
    highlight,
    highlightColor: highlight ? headerConfigString<NavigationMenuColor>(navigation.highlight?.color) : undefined,
    variant: headerConfigString<NavigationMenuVariant>(navigation.variant),
  }
})
const menuAngled = computed(() => Boolean(theme.navigation.slideover?.angle))
const toggleComponent = computed(() => toRegisteredComponent(theme.navigation?.toggleComponent))
const actionsComponent = computed(() => toRegisteredComponent(theme.navigation?.actionsComponent))
const siteTitle = computed(() => page.value?.site_info?.name ?? '')
const showColorModeToggle = computed(() => appConfig.colorMode?.showToggle !== false)
const finalIsScrolled = computed(() => {
  if (!hydrated.value) return false
  return isScrolled.value || forceScrolled.value
})
const isTransparentHeader = computed(() =>
  Boolean(theme.navigation.transparentAtTop && !finalIsScrolled.value),
)
const logoSurface = computed(() =>
  isTransparentHeader.value
    ? headerLogoSurface(theme.navigation.transparentSurface)
    : 'auto',
)
const headerMode = computed<HeaderMode>(() => props.mode ?? 'fixed')
const isFixed = computed(() => headerMode.value === 'fixed')
const isSticky = computed(() => headerMode.value === 'sticky')
const isPinned = computed(() => isFixed.value || isSticky.value)
const headerPositionClasses = computed(() => {
  if (!isPinned.value) return 'relative w-full'

  return [
    isFixed.value ? 'fixed' : 'sticky',
    'z-50 w-full',
    // The editorial tabs bar publishes its height; without it the var is 0.
    // Written out in full: Tailwind finds classes by reading source text, so
    // a class built from the constant would never be compiled.
    shouldHide.value ? 'top-0' : 'top-[var(--stir-editorial-offset,0px)]',
  ].join(' ')
})
const shouldHide = computed(() =>
  isPinned.value &&
  ((isFront.value && !finalIsScrolled.value && theme.navigation.hidden) ||
    (finalIsScrolled.value &&
      scrollDirection.value === 'down' &&
      !atBottom.value)),
)
const headerClasses = computed(() => [
  'stir-header transition-all',
  theme.navigation.base,
  headerPositionClasses.value,
  isTransparentHeader.value
    ? 'bg-transparent backdrop-none border-none backdrop-blur-none'
    : theme.navigation.background,
  finalIsScrolled.value && 'is-scrolled stir-header--scrolled',
  shouldHide.value && '-translate-y-full',
])
const headerContainerClasses = computed(() => [
  isCenteredToggleLayout.value ? centeredToggleUi.container : headerUi.container,
  theme.navigation.container,
  isSplitLogoLayout.value && theme.navigation.splitLogo?.container,
])
const logoClasses = computed(() => joinHeaderClasses(
  'app-logo',
  'transition-all duration-300',
  finalIsScrolled.value
    ? theme.navigation.logoScrolledClass || theme.navigation.logoClass
    : theme.navigation.logoClass,
))
const mobileLogoClasses = computed(() => joinHeaderClasses(
  theme.navigation.splitLogo?.mobileLogo,
  logoClasses.value,
))
const headerLeftClasses = computed(() => {
  if (isCenteredToggleLayout.value) return centeredToggleUi.left

  return isSplitLogoLayout.value
    ? headerClassName(theme.navigation.splitLogo?.mobileLeft) || headerUi.left
    : headerUi.left
})
const headerCenterClasses = computed(() => {
  if (isCenteredToggleLayout.value) return centeredToggleUi.center

  return [headerUi.center, isSplitLogoLayout.value && theme.navigation.splitLogo?.center]
})
const menuContent = computed<SlideoverContentAttrs>(() => ({
  id: menuId,
  'aria-label': 'Site navigation menu',
  style: headerMenuAngleStyle(theme.navigation.slideover),
}))
const menuUi = computed(() => ({
  overlay: joinHeaderClasses(
    mobileOnlyClass.value,
    menuAngled.value && '!bg-transparent stir-menu-overlay',
    menuAngled.value && menuSide.value === 'left' && 'stir-menu-overlay-left',
  ),
  content: joinHeaderClasses(
    headerUi.content,
    mobileOnlyClass.value,
    menuAngled.value
      && 'stir-menu-panel !overflow-hidden !border-0 !divide-y-0 !shadow-none !ring-0 sm:!ring-0',
    headerClassName(theme.navigation.slideover?.content) || (menuAngled.value && '!bg-default'),
  ),
  header: joinHeaderClasses(
    headerUi.header,
    theme.navigation.header,
    menuAngled.value && 'bg-transparent',
  ),
  body: joinHeaderClasses(
    headerUi.body,
    theme.navigation.slideover?.body,
    menuAngled.value && 'bg-transparent',
  ),
}))
const headerRightClasses = computed(() => {
  if (isCenteredToggleLayout.value) return centeredToggleUi.right
  if (isToggleLayout.value) return headerUi.right

  return joinHeaderClasses(
    headerUi.right,
    (appConfig.colorMode?.forced || appConfig.colorMode?.showToggle === false) && !hasDesktopActions.value
      ? 'block lg:hidden lg:flex-0'
      : 'lg:flex-1',
    isSplitLogoLayout.value && theme.navigation.splitLogo?.right,
  )
})
const baseToggleClasses = computed(() => joinHeaderClasses(
  headerUi.toggle,
  mobileOnlyClass.value,
  !isCenteredToggleLayout.value && (menuToggleSide.value === 'left' ? '-ms-1.5' : '-me-1.5'),
))
const toggleClasses = computed(() => [
  baseToggleClasses.value,
  isTransparentHeader.value && theme.navigation.toggleTransparentClass,
  theme.navigation.toggleClass,
])
const toggleIcon = computed(() => {
  const icons = (appConfig.ui as { icons?: Partial<Record<'close' | 'menu', string>> } | undefined)?.icons

  return menuOpen.value ? icons?.close || 'i-lucide-x' : icons?.menu || 'i-lucide-menu'
})
const toggleIconClass = computed(() =>
  headerClassName(theme.navigation.toggleIcon) || 'size-7',
)

const { data: mainMenu } = await useMenu('main')
const splitLogoMarker = computed(() => headerConfigString(theme.navigation?.logoMenuMarker))
const splitDesktopNavClasses = computed(() =>
  headerClassName(theme.navigation.splitLogo?.desktopNav) || 'hidden lg:flex',
)
const showSlideoverBrand = computed(() => theme.navigation.slideover?.logo !== false)

const navLinks = computed<NavigationMenuItem[]>(() =>
  (Array.isArray(mainMenu.value) ? mainMenu.value : [])
    .map((item: DrupalMenuTreeItem) => mapDrupalMenuItem(item)),
)
const headerActions = computed(() => extractHeaderActions(navLinks.value, theme.navigation?.actionItems))
const actionButtons = computed(() => headerActions.value.actions.filter(action => action.as === 'button'))
const actionNavLinks = computed(() =>
  headerActions.value.actions.filter(action => action.as === 'navigation').map(action => action.item),
)
const hasDesktopActions = computed(() => Boolean(headerActions.value.actions.length || actionsComponent.value))
const splitMenu = computed(() => splitMenuAtMarker(
  headerActions.value.items,
  isSplitLogoLayout.value ? splitLogoMarker.value : undefined,
))
const beforeLogo = computed(() => splitMenu.value.before)
const afterLogo = computed(() => splitMenu.value.after)
const splitRightNavigationLabel = computed(() =>
  beforeLogo.value.length ? 'Additional navigation' : 'Primary navigation',
)
// Action items keep their menu position in the mobile panel unless routed to
// its buttons or hidden.
const mobileNavLinks = computed(() => {
  const marker = splitMenu.value.markerIndex > -1 ? splitLogoMarker.value : undefined
  const excluded = new Set(headerActions.value.actions
    .filter(action => action.mobile !== 'menu')
    .map(action => action.item))

  return navLinks.value.filter(item => !excluded.has(item) && (!marker || item.label !== marker))
})
const mobileActionButtons = computed(() =>
  headerActions.value.actions.filter(action => action.mobile === 'button'),
)

let menuToggleElement: HTMLElement | null = null
let menuClosedByNavigation = false
let menuWasOpened = false
let lastInputWasPointer = false

useEventListener(import.meta.client ? document : undefined, 'pointerdown', () => {
  lastInputWasPointer = true
}, { capture: true, passive: true })
useEventListener(import.meta.client ? document : undefined, 'keydown', () => {
  lastInputWasPointer = false
}, { capture: true, passive: true })

function setMenuToggle(instance: unknown) {
  menuToggleElement = (instance as { $el?: HTMLElement } | null)?.$el ?? null
}

function toggleMenu() {
  if (menuOpen.value) {
    menuOpen.value = false
    return
  }

  menuMounted.value = true
  menuWasOpened = true
  menuOpen.value = true
}

// Return focus to the toggle when the visitor closes the menu, but not after a
// menu link navigates, so focus stays with the new page. Keyboard closes show
// the focus ring; pointer and touch closes restore focus without it. A menu
// kept mounted while closed can report a leave on first render, before anyone
// opened it; that must not focus the toggle on page load.
function restoreMenuFocus() {
  if (menuWasOpened && !menuClosedByNavigation)
    menuToggleElement?.focus({ focusVisible: !lastInputWasPointer } as FocusOptions)
  menuWasOpened = false
  menuClosedByNavigation = false
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
    if (menuOpen.value) menuClosedByNavigation = true
    menuOpen.value = false
  },
)

watch(menuOpen, (val) => {
  if (val && import.meta.client)
    (document.activeElement as HTMLElement | null)?.blur()
})
</script>

<template>
  <DefineMenuToggle>
    <UButton
      :ref="setMenuToggle"
      :aria-controls="menuId"
      :aria-expanded="menuOpen"
      :aria-label="menuOpen ? 'Close navigation menu' : 'Open navigation menu'"
      :class="toggleClasses"
      color="neutral"
      data-slot="toggle"
      variant="ghost"
      @click="toggleMenu"
    >
      <template #leading>
        <component
          :is="toggleComponent"
          v-if="toggleComponent"
          :open="menuOpen"
          :scrolled="finalIsScrolled"
        />
        <UIcon
          v-else
          aria-hidden="true"
          :class="toggleIconClass"
          data-slot="leadingIcon"
          :name="toggleIcon"
        />
      </template>
    </UButton>
  </DefineMenuToggle>

  <LazyRegionArea area="top" />
  <LazyDrupalTabs v-if="hasEditorialAccess" />

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
        :class="headerLeftClasses"
        data-slot="left"
      >
        <ReuseMenuToggle v-if="!isCenteredToggleLayout && menuToggleSide === 'left'" />

        <ULink
          v-if="showBrand"
          aria-label="Home"
          :class="headerUi.title"
          data-slot="title"
          to="/"
        >
          <AppLogo
            v-if="theme.navigation.logo"
            :add-classes="isSplitLogoLayout ? mobileLogoClasses : logoClasses"
            :surface="logoSurface"
          />
          <template v-else>
            {{ siteTitle }}
          </template>
        </ULink>
      </div>

      <div
        v-if="!isToggleLayout"
        :class="headerCenterClasses"
        data-slot="center"
      >
        <ReuseMenuToggle v-if="isCenteredToggleLayout" />

        <template v-else-if="isSplitLogoLayout">
          <LazyUNavigationMenu
            v-if="beforeLogo.length"
            v-bind="navProps"
            aria-label="Primary navigation"
            :class="[splitDesktopNavClasses, theme.navigation.splitLogo?.leftNav]"
            :items="beforeLogo"
          />

          <ULink
            v-if="showBrand && theme.navigation.logo"
            aria-label="Site Logo"
            :class="theme.navigation.splitLogo?.logoLink"
            to="/"
          >
            <AppLogo
              :add-classes="logoClasses"
              :surface="logoSurface"
            />
          </ULink>

          <LazyUNavigationMenu
            v-if="afterLogo.length"
            v-bind="navProps"
            :aria-label="splitRightNavigationLabel"
            :class="[splitDesktopNavClasses, theme.navigation.splitLogo?.rightNav]"
            :items="afterLogo"
          />
        </template>

        <LazyUNavigationMenu
          v-else
          v-bind="navProps"
          aria-label="Site Navigation"
          class="app-nav app-nav-desktop"
          :items="headerActions.items"
        />
      </div>

      <div
        :class="headerRightClasses"
        data-slot="right"
      >
        <UButton
          v-for="action in actionButtons"
          :key="action.item.label"
          :class="['hidden shrink-0 whitespace-nowrap lg:inline-flex', action.button.class]"
          :color="action.button.color"
          data-slot="action"
          :icon="action.button.icon"
          :label="action.item.label"
          :size="action.button.size"
          :target="action.item.target"
          :to="action.item.to"
          :variant="action.button.variant"
        />

        <LazyUNavigationMenu
          v-if="actionNavLinks.length"
          v-bind="navProps"
          aria-label="Secondary navigation"
          class="app-nav app-nav-actions app-nav-desktop hidden lg:flex"
          :items="actionNavLinks"
        />

        <component
          :is="actionsComponent"
          v-if="actionsComponent"
          :actions="headerActions.actions"
          :scrolled="finalIsScrolled"
        />

        <LazyIconsColorMode v-if="showColorModeToggle" />

        <ReuseMenuToggle v-if="!isCenteredToggleLayout && menuToggleSide === 'right'" />
      </div>
    </UContainer>
  </header>

  <LazyUSlideover
    v-if="menuMounted"
    v-model:open="menuOpen"
    :content="menuContent"
    description="Site navigation"
    :overlay="theme.navigation.slideover?.overlay ?? true"
    :portal="theme.navigation.slideover?.portal ?? true"
    :side="menuSide"
    title="Navigation"
    :ui="menuUi"
    :unmount-on-hide="theme.navigation.slideover?.unmountOnHide ?? true"
    @after:leave="restoreMenuFocus"
  >
    <template #content>
      <div
        :class="menuUi.header"
        data-slot="header"
      >
        <LazyAppHeaderOverlayHeader
          :left-class="headerUi.left"
          :logo-classes="logoClasses"
          :menu-id="menuId"
          :right-class="headerUi.overlayRight"
          :show-brand="showSlideoverBrand"
          :show-color-mode-toggle="showColorModeToggle"
          :show-logo="Boolean(theme.navigation.logo)"
          :site-title="siteTitle"
          :title-class="headerUi.title"
          :toggle-class="baseToggleClasses"
          :toggle-icon="toggleIcon"
          :toggle-icon-class="toggleIconClass"
          @close="menuOpen = false"
        />
      </div>

      <div
        :class="menuUi.body"
        data-slot="body"
      >
        <LazyAppHeaderMobileMenu
          :actions="mobileActionButtons"
          :items="mobileNavLinks"
          :link-class="headerClassName(theme.navigation.slideover?.link)"
          :list-class="headerClassName(theme.navigation.slideover?.list)"
        />
      </div>
    </template>
  </LazyUSlideover>
</template>
