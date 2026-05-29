import type {
  UNavigationMenu as UNavigationMenuComponent,
} from '#components'
import type { NavigationMenuItem } from '@nuxt/ui'
import type { MaybeRefOrGetter } from 'vue'
import {
  toValue,
  useId,
} from 'vue'
import {
  menuItemTo,
  type DrupalMenuItemLink,
} from '~/utils/navigation'

export type AppHeaderMode = 'fixed' | 'static'

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

type UseAppHeaderShellOptions = {
  centerClass?: string
  logoBaseClass?: string
  mode?: MaybeRefOrGetter<AppHeaderMode | undefined>
}

const menuContentBase = '!overflow-hidden !border-0 !bg-default !shadow-none sm:!ring-0'

function toToggleDirection(value: unknown): 'left' | 'right' | 'top' | 'bottom' {
  return value === 'left' || value === 'right' || value === 'top' || value === 'bottom'
    ? value
    : 'right'
}

function toHeaderToggleSide(value: unknown): 'left' | 'right' {
  return value === 'left' ? 'left' : 'right'
}

function toStringProp<T extends string>(value: unknown): T | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() as T : undefined
}

function toNavigationColor(value: unknown): NavigationMenuColor | undefined {
  return toStringProp<NavigationMenuColor>(value)
}

function toNavigationVariant(value: unknown): NavigationMenuVariant | undefined {
  return toStringProp<NavigationMenuVariant>(value)
}

function toClassName(value: unknown): string {
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

export async function useAppHeaderShell(options: UseAppHeaderShellOptions = {}) {
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
  const menuId = useId()
  const headerUi = {
    root: '',
    container: 'flex items-center justify-between gap-3',
    left: 'lg:flex-1 flex items-center gap-1.5',
    center: options.centerClass ?? 'hidden lg:flex',
    right: 'flex items-center justify-end lg:flex-1 gap-1.5',
    title: 'shrink-0 font-bold text-xl text-highlighted flex items-end gap-1.5',
    toggle: 'lg:hidden',
    content: 'lg:hidden',
    overlay: 'lg:hidden',
    header: 'shrink-0 flex items-center justify-between gap-3',
    body: 'p-4 sm:p-6 overflow-y-auto',
  } as const

  const menuSide = computed(() => toToggleDirection(theme.navigation?.toggleDirection))
  const menuToggleSide = computed(() => toHeaderToggleSide(menuSide.value))
  const headerNavColor = computed(() => toNavigationColor(theme.navigation?.color))
  const headerHighlightColor = computed(() =>
    theme.navigation?.highlight?.show ? toNavigationColor(theme.navigation.highlight?.color) : undefined,
  )
  const headerNavVariant = computed(() => toNavigationVariant(theme.navigation?.variant))
  const siteTitle = computed(() => page.value?.site_info?.name ?? '')
  const showColorModeToggle = computed(() => appConfig.colorMode?.showToggle !== false)
  const logoClasses = computed(() =>
    [
      toClassName(options.logoBaseClass ?? 'app-logo'),
      'transition-all duration-300',
      finalIsScrolled.value
        ? theme.navigation.logoScrolledSize || theme.navigation.logoSize
        : theme.navigation.logoSize,
    ].filter(Boolean).join(' '),
  )
  const mobileLogoClasses = computed(() =>
    ['lg:hidden', logoClasses.value].filter(Boolean).join(' '),
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
  const headerClasses = computed(() =>
    [
      headerUi.root,
      headerRootClasses.value,
    ].filter(Boolean).join(' '),
  )
  const headerContainerClasses = computed(() =>
    [
      headerUi.container,
      toClassName(theme.navigation.container),
    ].filter(Boolean).join(' '),
  )
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
  const navLinks = computed<NavigationMenuItem[]>(() =>
    mainMenu.value.map((item: MainMenuItem) => mapMenuItem(item)),
  )

  const finalIsScrolled = computed(() => {
    if (!hydrated.value) return false
    return isScrolled.value || forceScrolled.value
  })

  const isFixed = computed(() => {
    if (toValue(options.mode) === 'fixed') return true
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
      toClassName(theme.navigation?.base),
      isFixed.value
        ? `fixed z-50 w-full ${isAdministrator.value && !shouldHide ? 'top-[3.1rem]' : 'top-0'}`
        : 'relative w-full',
      toClassName(
        theme.navigation.transparentTop && !finalIsScrolled.value
          ? 'bg-transparent backdrop-none border-none backdrop-blur-none'
          : theme.navigation?.background,
      ),
      finalIsScrolled.value ? 'is-scrolled' : '',
      shouldHide ? '-translate-y-full' : '',
    ].filter(Boolean).join(' ')
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

  return {
    appConfig,
    finalIsScrolled,
    headerClasses,
    headerContainerClasses,
    headerHighlightColor,
    headerNavColor,
    headerNavVariant,
    headerRightClasses,
    headerUi,
    isAdministrator,
    logoClasses,
    menuBodyClasses,
    menuContent,
    menuContentClasses,
    menuHeaderClasses,
    menuId,
    menuOpen,
    menuOverlayClasses,
    menuSide,
    menuToggleSide,
    mobileLogoClasses,
    navLinks,
    page,
    showColorModeToggle,
    siteTitle,
    theme,
    toggleClasses,
    toggleIcon,
  }
}
