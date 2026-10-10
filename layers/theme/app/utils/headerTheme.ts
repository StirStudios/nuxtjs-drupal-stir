// Normalises `stirTheme.navigation` values for the site header. Site app
// configs are loosely typed records, so each reader falls back to the
// documented default instead of passing an unknown value to Nuxt UI.

export type HeaderToggleDirection = 'left' | 'right' | 'top' | 'bottom'
export type HeaderDesktopLayout = 'default' | 'split-logo' | 'centered-toggle' | 'toggle'
export type HeaderLogoSurface = 'auto' | 'light' | 'dark'

type HeaderSlideoverConfig = {
  angle?: boolean
  angleDeg?: number
  angleOffsetX?: number | string
}

export const headerToggleDirection = (value: unknown): HeaderToggleDirection =>
  value === 'left' || value === 'right' || value === 'top' || value === 'bottom'
    ? value
    : 'right'

export const headerDesktopLayout = (value: unknown): HeaderDesktopLayout =>
  value === 'split-logo' || value === 'centered-toggle' || value === 'toggle' ? value : 'default'

export type HeaderDesktopBreakpoint = 'lg' | 'xl'

export const headerDesktopBreakpoint = (value: unknown): HeaderDesktopBreakpoint =>
  value === 'xl' ? 'xl' : 'lg'

// The classes that switch the header between the menu toggle and the desktop
// menu. Written out in full per breakpoint so Tailwind generates them.
const desktopBreakpointClasses = {
  lg: {
    flexOne: 'lg:flex-1',
    showFlex: 'hidden lg:flex',
    showInlineFlex: 'hidden lg:inline-flex',
    hideFromDesktop: 'lg:hidden',
    collapseFromDesktop: 'block lg:hidden lg:flex-0',
  },
  xl: {
    flexOne: 'xl:flex-1',
    showFlex: 'hidden xl:flex',
    showInlineFlex: 'hidden xl:inline-flex',
    hideFromDesktop: 'xl:hidden',
    collapseFromDesktop: 'block xl:hidden xl:flex-0',
  },
} as const

export const headerDesktopClasses = (breakpoint: HeaderDesktopBreakpoint) =>
  desktopBreakpointClasses[breakpoint]

export const headerLogoSurface = (value: unknown): HeaderLogoSurface =>
  value === 'light' || value === 'dark' ? value : 'auto'

export const headerConfigString = <T extends string>(value: unknown): T | undefined =>
  typeof value === 'string' && value.trim() ? value.trim() as T : undefined

export function headerClassName(value: unknown): string {
  if (typeof value === 'string') return value.trim()

  if (Array.isArray(value)) {
    return value
      .map(entry => headerClassName(entry))
      .filter(Boolean)
      .join(' ')
  }

  return ''
}

/** Joins class fragments, dropping empty ones. */
export const joinHeaderClasses = (...classes: unknown[]): string =>
  classes.map(entry => headerClassName(entry)).filter(Boolean).join(' ')

/**
 * CSS custom properties for the angled slideover panel, or undefined when the
 * panel is square.
 */
export function headerMenuAngleStyle(
  slideover: HeaderSlideoverConfig | undefined,
): Record<`--${string}`, string> | undefined {
  if (!slideover?.angle) return undefined

  const degRaw = Number(slideover.angleDeg ?? 35)
  const angleDeg = Number.isFinite(degRaw) ? degRaw : 35
  const angleEdge = Math.min(48, Math.max(12, angleDeg * 0.65))
  const offsetX = slideover.angleOffsetX

  return {
    '--stir-menu-angle-edge': `${angleEdge}%`,
    ...(offsetX !== undefined
      ? { '--stir-menu-offset-x': typeof offsetX === 'number' ? `${offsetX}px` : String(offsetX) }
      : {}),
  }
}
