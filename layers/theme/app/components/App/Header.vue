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
import { STIR_EDITORIAL_OFFSET_VAR } from '#stir/utils/editorialOffset'

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

type ToggleDirection = 'left' | 'right' | 'top' | 'bottom'
type HeaderToggleSide = 'left' | 'right'
type DesktopHeaderLayout = 'default' | 'split-logo' | 'centered-toggle'
type LogoSurface = 'auto' | 'light' | 'dark'
type ComponentProps<T> = T extends new () => { $props: infer P } ? P : never
type NavigationMenuProps = ComponentProps<typeof UNavigationMenuComponent>
type SlideoverProps = ComponentProps<typeof USlideoverComponent>
type NavigationMenuColor = Extract<NonNullable<NavigationMenuProps['color']>, string>
type NavigationMenuVariant = Extract<NonNullable<NavigationMenuProps['variant']>, string>
type SlideoverContent = NonNullable<SlideoverProps['content']>
type SlideoverContentAttrs = SlideoverContent & {
  'aria-label'?: string
  id?: string
  style?: Record<`--${string}`, string>
}

const toToggleDirection = (value: unknown): ToggleDirection => {
  return value === 'left' || value === 'right' || value === 'top' || value === 'bottom'
    ? value
    : 'right'
}
const toHeaderToggleSide = (value: unknown): HeaderToggleSide => (value === 'left' ? 'left' : 'right')
const toDesktopHeaderLayout = (value: unknown): DesktopHeaderLayout =>
  value === 'split-logo' || value === 'centered-toggle' ? value : 'default'
const toLogoSurface = (value: unknown): LogoSurface =>
  value === 'light' || value === 'dark' ? value : 'auto'

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

const toRegisteredComponent = (value: unknown) => {
  const name = toStringProp<string>(value)

  return name ? nuxtApp.vueApp.component(name) ?? null : null
}

const menuSide = computed(() => toToggleDirection(theme.navigation?.toggleDirection))
const menuToggleSide = computed(() => toHeaderToggleSide(menuSide.value))
const headerNavColor = computed(() => toNavigationColor(theme.navigation?.color))
const headerHighlightColor = computed(() =>
  theme.navigation?.highlight?.show ? toNavigationColor(theme.navigation.highlight?.color) : undefined,
)
const headerNavVariant = computed(() => toNavigationVariant(theme.navigation?.variant))
const headerNavContentOrientation = computed(() =>
  theme.navigation?.contentOrientation === 'vertical' ? 'vertical' : 'horizontal',
)
const desktopHeaderLayout = computed(() => toDesktopHeaderLayout(theme.navigation?.desktopLayout))
const isSplitLogoLayout = computed(() => desktopHeaderLayout.value === 'split-logo')
const isCenteredToggleLayout = computed(() => desktopHeaderLayout.value === 'centered-toggle')
// The centred toggle is the only navigation at every breakpoint.
const mobileOnlyClass = computed(() => isCenteredToggleLayout.value ? '' : 'lg:hidden')
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
    ? toLogoSurface(theme.navigation.transparentSurface)
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
    shouldHide.value ? 'top-0' : `top-[var(${STIR_EDITORIAL_OFFSET_VAR},0px)]`,
  ].join(' ')
})
const shouldHide = computed(() =>
  isPinned.value &&
  ((isFront.value && !finalIsScrolled.value && theme.navigation.hidden) ||
    (finalIsScrolled.value &&
      scrollDirection.value === 'down' &&
      !atBottom.value)),
)
const headerClasses = computed(() =>
  [
    'stir-header transition-all',
    toClassName(theme.navigation.base),
    headerPositionClasses.value,
    toClassName(
      isTransparentHeader.value
        ? 'bg-transparent backdrop-none border-none backdrop-blur-none'
        : theme.navigation.background,
    ),
    finalIsScrolled.value ? 'is-scrolled stir-header--scrolled' : '',
    shouldHide.value ? '-translate-y-full' : '',
  ].filter(Boolean).join(' '),
)
const headerContainerClasses = computed(() =>
  [
    isCenteredToggleLayout.value ? centeredToggleUi.container : headerUi.container,
    toClassName(theme.navigation.container),
    isSplitLogoLayout.value ? toClassName(theme.navigation.splitLogo?.container) : '',
  ].filter(Boolean).join(' '),
)
const navigationConfig = computed(() => theme.navigation as Record<string, unknown>)
const logoClasses = computed(() =>
  [
    'app-logo',
    'transition-all duration-300',
    finalIsScrolled.value
      ? navigationConfig.value.logoScrolledClass || navigationConfig.value.logoClass
      : navigationConfig.value.logoClass,
  ].join(' '),
)
const mobileLogoClasses = computed(() =>
  [
    toClassName(theme.navigation.splitLogo?.mobileLogo),
    logoClasses.value,
  ].filter(Boolean).join(' '),
)
const headerLeftClasses = computed(() => {
  if (isCenteredToggleLayout.value) return centeredToggleUi.left

  return isSplitLogoLayout.value
    ? toClassName(theme.navigation.splitLogo?.mobileLeft) || headerUi.left
    : headerUi.left
})
const headerCenterClasses = computed(() => {
  if (isCenteredToggleLayout.value) return centeredToggleUi.center

  return [
    headerUi.center,
    isSplitLogoLayout.value ? toClassName(theme.navigation.splitLogo?.center) : '',
  ].filter(Boolean).join(' ')
})
const menuContent = computed<SlideoverContentAttrs>(() => {
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
  const offsetX = slideover?.angleOffsetX

  return {
    id: menuId,
    'aria-label': 'Site navigation menu',
    style: {
      '--stir-menu-angle-edge': `${angleEdge}%`,
      ...(offsetX !== undefined
        ? {
            '--stir-menu-offset-x':
              typeof offsetX === 'number' ? `${offsetX}px` : String(offsetX),
          }
        : {}),
    },
  }
})
const menuOverlayClasses = computed(() =>
  [
    mobileOnlyClass.value,
    theme.navigation.slideover?.angle ? '!bg-transparent' : '',
  ].filter(Boolean).join(' '),
)
const menuContentClasses = computed(() => {
  const angleEnabled = Boolean(theme.navigation.slideover?.angle)

  return [
    headerUi.content,
    mobileOnlyClass.value,
    angleEnabled
      ? 'stir-menu-panel !overflow-hidden !border-0 !divide-y-0 !shadow-none !ring-0 sm:!ring-0'
      : '',
    toClassName(theme.navigation.slideover?.content) || (angleEnabled ? '!bg-default' : ''),
  ].filter(Boolean).join(' ')
})
const menuHeaderClasses = computed(() =>
  [
    headerUi.header,
    toClassName(theme.navigation.header),
    theme.navigation.slideover?.angle ? 'bg-transparent' : '',
  ].filter(Boolean).join(' '),
)
const menuBodyClasses = computed(() =>
  [
    headerUi.body,
    toClassName(theme.navigation.slideover?.body),
    theme.navigation.slideover?.angle ? 'bg-transparent' : '',
  ].filter(Boolean).join(' '),
)
const headerRightClasses = computed(() => {
  if (isCenteredToggleLayout.value) return centeredToggleUi.right

  return [
    headerUi.right,
    (appConfig.colorMode?.forced || appConfig.colorMode?.showToggle === false) && !hasDesktopActions.value
      ? 'block lg:hidden lg:flex-0'
      : 'lg:flex-1',
    isSplitLogoLayout.value ? toClassName(theme.navigation.splitLogo?.right) : '',
  ].filter(Boolean).join(' ')
})
const baseToggleClasses = computed(() =>
  [
    headerUi.toggle,
    mobileOnlyClass.value,
    isCenteredToggleLayout.value ? '' : menuToggleSide.value === 'left' ? '-ms-1.5' : '-me-1.5',
  ].filter(Boolean).join(' '),
)
const toggleClasses = computed(() =>
  [
    baseToggleClasses.value,
    isTransparentHeader.value ? toClassName(theme.navigation.toggleTransparentClass) : '',
    toClassName(theme.navigation.toggleClass),
  ].filter(Boolean).join(' '),
)
const toggleIcon = computed(() => {
  const icons = (appConfig.ui as { icons?: Partial<Record<'close' | 'menu', string>> } | undefined)?.icons

  return menuOpen.value ? icons?.close || 'i-lucide-x' : icons?.menu || 'i-lucide-menu'
})
const toggleIconClass = computed(() =>
  toClassName(theme.navigation.toggleIcon) || 'size-7',
)

const { data: mainMenu } = await useMenu('main')
const splitLogoMarker = computed(() => toStringProp(theme.navigation?.logoMenuMarker))
const splitDesktopNavClasses = computed(() =>
  toClassName(theme.navigation.splitLogo?.desktopNav) || 'hidden lg:flex',
)
const splitLeftNavClasses = computed(() => toClassName(theme.navigation.splitLogo?.leftNav))
const splitRightNavClasses = computed(() => toClassName(theme.navigation.splitLogo?.rightNav))
const splitLogoLinkClasses = computed(() => toClassName(theme.navigation.splitLogo?.logoLink))
const showSlideoverBrand = computed(() => theme.navigation.slideover?.logo !== false)
const slideoverLinkClasses = computed(() => toClassName(theme.navigation.slideover?.link))
const slideoverListClasses = computed(() => toClassName(theme.navigation.slideover?.list))

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
        :class="headerCenterClasses"
        data-slot="center"
      >
        <ReuseMenuToggle v-if="isCenteredToggleLayout" />

        <template v-else-if="isSplitLogoLayout">
          <LazyUNavigationMenu
            v-if="beforeLogo.length"
            aria-label="Primary navigation"
            :class="[splitDesktopNavClasses, splitLeftNavClasses]"
            :color="headerNavColor"
            :content-orientation="headerNavContentOrientation"
            :highlight="theme.navigation.highlight.show"
            :highlight-color="headerHighlightColor"
            :items="beforeLogo"
            :variant="headerNavVariant"
          />

          <ULink
            v-if="theme.navigation.logo"
            aria-label="Site Logo"
            :class="splitLogoLinkClasses"
            to="/"
          >
            <AppLogo
              :add-classes="logoClasses"
              :surface="logoSurface"
            />
          </ULink>

          <LazyUNavigationMenu
            v-if="afterLogo.length"
            :aria-label="splitRightNavigationLabel"
            :class="[splitDesktopNavClasses, splitRightNavClasses]"
            :color="headerNavColor"
            :content-orientation="headerNavContentOrientation"
            :highlight="theme.navigation.highlight.show"
            :highlight-color="headerHighlightColor"
            :items="afterLogo"
            :variant="headerNavVariant"
          />
        </template>

        <LazyUNavigationMenu
          v-else
          aria-label="Site Navigation"
          class="app-nav app-nav-desktop"
          :color="headerNavColor"
          :content-orientation="headerNavContentOrientation"
          :highlight="theme.navigation.highlight.show"
          :highlight-color="headerHighlightColor"
          :items="headerActions.items"
          :variant="headerNavVariant"
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
          aria-label="Secondary navigation"
          class="app-nav app-nav-actions app-nav-desktop hidden lg:flex"
          :color="headerNavColor"
          :content-orientation="headerNavContentOrientation"
          :highlight="theme.navigation.highlight.show"
          :highlight-color="headerHighlightColor"
          :items="actionNavLinks"
          :variant="headerNavVariant"
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
    :ui="{
      overlay: menuOverlayClasses,
      content: menuContentClasses,
      header: menuHeaderClasses,
      body: menuBodyClasses,
    }"
    :unmount-on-hide="theme.navigation.slideover?.unmountOnHide ?? true"
    @after:leave="restoreMenuFocus"
  >
    <template #content>
      <div
        :class="menuHeaderClasses"
        data-slot="header"
      >
        <LazyAppHeaderOverlayHeader
          :left-class="headerUi.left"
          :logo-classes="logoClasses"
          :menu-id="menuId"
          :right-class="headerRightClasses"
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
        :class="menuBodyClasses"
        data-slot="body"
      >
        <LazyAppHeaderMobileMenu
          :actions="mobileActionButtons"
          :items="mobileNavLinks"
          :link-class="slideoverLinkClasses"
          :list-class="slideoverListClasses"
        />
      </div>
    </template>
  </LazyUSlideover>
</template>
