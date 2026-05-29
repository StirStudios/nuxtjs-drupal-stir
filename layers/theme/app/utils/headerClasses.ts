export type AppHeaderScrollDirection = 'up' | 'down' | null

export type AppHeaderNavigationClassConfig = {
  base?: unknown
  background?: unknown
  isHidden?: boolean
  transparentTop?: boolean
}

export type AppHeaderRootClassOptions = {
  atBottom: boolean
  finalIsScrolled: boolean
  isAdministrator: boolean
  isFixed: boolean
  isFront: boolean
  navigation: AppHeaderNavigationClassConfig
  scrollDirection: AppHeaderScrollDirection
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

export function buildAppHeaderRootClasses({
  atBottom,
  finalIsScrolled,
  isAdministrator,
  isFixed,
  isFront,
  navigation,
  scrollDirection,
}: AppHeaderRootClassOptions): string {
  const shouldHide =
    isFixed &&
    ((isFront && !finalIsScrolled && navigation.isHidden) ||
      (finalIsScrolled && scrollDirection === 'down' && !atBottom))

  return [
    'stir-header',
    toClassName(navigation.base),
    isFixed
      ? `fixed z-50 w-full ${isAdministrator && !shouldHide ? 'top-[3.1rem]' : 'top-0'}`
      : 'relative w-full',
    toClassName(
      navigation.transparentTop && !finalIsScrolled
        ? 'bg-transparent backdrop-none border-none backdrop-blur-none'
        : navigation.background,
    ),
    finalIsScrolled ? 'is-scrolled stir-header--scrolled' : '',
    shouldHide ? 'stir-header--hidden' : '',
  ].filter(Boolean).join(' ')
}
