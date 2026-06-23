export type ColorModePreference = 'light' | 'dark' | 'system'

export type ColorModePolicyInput = {
  forced?: boolean
  preference?: string
  showToggle?: boolean
  lightRoutes?: string[]
  darkRoutes?: string[]
}

type RouteOverrideInput = {
  path: string
  lightRoutes?: string[]
  darkRoutes?: string[]
}

export function normalizeColorModePreference(
  preference: string | undefined,
): ColorModePreference {
  const normalized = preference?.trim().toLowerCase()

  if (normalized === 'light' || normalized === 'dark' || normalized === 'system')
    return normalized

  return 'dark'
}

export function shouldLockGlobalColorMode(config: ColorModePolicyInput): boolean {
  const { forced = false, showToggle = true } = config

  return forced || !showToggle
}

export function matchesRoutePattern(path: string, rule: string): boolean {
  const normalizedRule = rule.trim()

  if (!normalizedRule) return false
  if (normalizedRule === '/') return path === '/'
  if (normalizedRule.endsWith('*')) {
    const prefix = normalizedRule.slice(0, -1)

    if (prefix === '') return false
    if (prefix.endsWith('/')) {
      return path.startsWith(prefix) && path.length > prefix.length
    }

    return path === prefix || path.startsWith(`${prefix}/`)
  }
  return path === normalizedRule
}

export function getRouteColorModeOverride({
  path,
  lightRoutes = [],
  darkRoutes = [],
}: RouteOverrideInput): Exclude<ColorModePreference, 'system'> | undefined {
  const isLight = lightRoutes.some((prefix) => matchesRoutePattern(path, prefix))
  const isDark = darkRoutes.some((prefix) => matchesRoutePattern(path, prefix))

  if (isLight) return 'light'
  if (isDark) return 'dark'
  return undefined
}

export type ResolvedColorModeState = {
  normalizedPreference: ColorModePreference
  lockGlobal: boolean
  routeOverride: Exclude<ColorModePreference, 'system'> | undefined
  effectivePreference: Exclude<ColorModePreference, 'system'> | undefined
  hideToggle: boolean
}

export function resolveColorModeState(
  config: ColorModePolicyInput,
  path: string,
): ResolvedColorModeState {
  const {
    forced = false,
    preference,
    showToggle = true,
    lightRoutes = [],
    darkRoutes = [],
  } = config

  const normalizedPreference = normalizeColorModePreference(preference)
  const lockGlobal = shouldLockGlobalColorMode({ forced, showToggle })
  const matchedRouteOverride = getRouteColorModeOverride({
    path,
    lightRoutes,
    darkRoutes,
  })

  // Forced mode is a hard global lock and disables route overrides.
  const routeOverride = forced ? undefined : matchedRouteOverride
  const effectivePreference = routeOverride || (
    lockGlobal && normalizedPreference !== 'system'
      ? normalizedPreference
      : undefined
  )

  return {
    normalizedPreference,
    lockGlobal,
    routeOverride,
    effectivePreference,
    hideToggle: lockGlobal || Boolean(routeOverride),
  }
}
