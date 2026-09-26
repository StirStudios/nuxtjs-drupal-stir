export type HeaderMode = 'fixed' | 'sticky'

const toHeaderMode = (value: unknown): HeaderMode =>
  value === 'sticky' ? 'sticky' : 'fixed'

/**
 * The site header's mode for the current route: `navigation.modeRoutes` first,
 * then `navigation.mode`. A fixed header sits over the page; a sticky one takes
 * its own space.
 */
export function useHeaderMode() {
  const route = useRoute()
  const { navigation } = useAppConfig().stirTheme

  return computed<HeaderMode>(() => {
    const modeRoutes = (navigation as Record<string, unknown> | undefined)?.modeRoutes as
      | Partial<Record<HeaderMode, string[]>>
      | undefined

    return (['fixed', 'sticky'] as const).find((mode) =>
      modeRoutes?.[mode]?.some((pattern) =>
        matchesRoutePattern(route.path, pattern),
      ),
    ) ?? toHeaderMode(navigation?.mode)
  })
}
