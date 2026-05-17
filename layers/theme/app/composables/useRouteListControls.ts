type RouteListControlValue = string | string[] | number

type RouteListControlField<T extends RouteListControlValue> = {
  defaultValue: T
  fromRoute?: (value: unknown, field: RouteListControlField<T>) => T
  isDefault?: (value: T, field: RouteListControlField<T>) => boolean
  toRoute?: (value: T, field: RouteListControlField<T>) => string | string[] | undefined
}

type RouteListControls = { page: number } & Record<string, RouteListControlValue>

type RouteListControlConfig<TControls extends RouteListControls> = {
  controls: { [K in keyof TControls]: RouteListControlField<TControls[K]> }
}

type RouteQuery = Record<string, string | string[] | undefined>

function routeArrayValue(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(String).filter(Boolean)
  }

  if (typeof value === 'string' && value.length > 0) {
    return value.split(',').map((entry) => entry.trim()).filter(Boolean)
  }

  return []
}

function routeStringValue(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.length > 0 ? value : fallback
}

function cleanQuery(query: RouteQuery): RouteQuery {
  return Object.fromEntries(
    Object.entries(query).filter(([, value]) => {
      if (Array.isArray(value)) return value.length > 0
      return value !== undefined && value !== ''
    }),
  )
}

function defaultFromRoute<T extends RouteListControlValue>(
  value: unknown,
  field: RouteListControlField<T>,
): T {
  if (Array.isArray(field.defaultValue)) {
    return routeArrayValue(value) as T
  }

  if (typeof field.defaultValue === 'number') {
    const parsed = Number.parseInt(routeStringValue(value, String(field.defaultValue)), 10)

    return (Number.isFinite(parsed) ? Math.max(0, parsed) : field.defaultValue) as T
  }

  return routeStringValue(value, String(field.defaultValue)) as T
}

function defaultToRoute<T extends RouteListControlValue>(
  value: T,
  field: RouteListControlField<T>,
): string | string[] | undefined {
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(',') : undefined
  }

  if (typeof value === 'number') {
    return value > 0 ? String(value) : undefined
  }

  if (typeof value === 'string') {
    return value.length > 0 && value !== field.defaultValue ? value : undefined
  }

  return undefined
}

function defaultIsDefault<T extends RouteListControlValue>(
  value: T,
  field: RouteListControlField<T>,
): boolean {
  if (Array.isArray(value) && Array.isArray(field.defaultValue)) {
    return value.length === 0 && field.defaultValue.length === 0
  }

  return value === field.defaultValue
}

export function useRouteListControls<TControls extends RouteListControls>(
  config?: RouteListControlConfig<TControls>,
) {
  const route = useRoute()
  const router = useRouter()
  const syncingFromRoute = ref(false)

  const controls = reactive(
    Object.fromEntries(
      Object.entries(config?.controls ?? {}).map(([key, field]) => [key, field.defaultValue]),
    ),
  ) as TControls
  const mutableControls = controls as Record<string, RouteListControlValue>

  const query = computed<RouteQuery>(() => {
    const nextQuery: RouteQuery = {}

    if (!config) return nextQuery

    for (const [key, field] of Object.entries(config.controls)) {
      const value = controls[key] ?? field.defaultValue
      const routeValue = field.toRoute?.(value, field) ?? defaultToRoute(value, field)

      nextQuery[key] = routeValue
    }

    return cleanQuery(nextQuery)
  })

  function routeQueryValue(key: string): string | string[] | undefined {
    const value = route.query[key] ?? route.query[`${key}[]`]

    if (Array.isArray(value)) {
      return value.filter((item): item is string => typeof item === 'string')
    }

    return typeof value === 'string' ? value : undefined
  }

  function routePageValue(key = 'page'): number | null {
    const routePage = routeQueryValue(key)
    const pageValue = Array.isArray(routePage) ? routePage[0] : routePage

    if (!pageValue || !/^\d+$/.test(pageValue)) return null

    return Number(pageValue)
  }

  function routeQueryExcluding(keys: string[]): Record<string, string | string[]> {
    const nextQuery: Record<string, string | string[]> = {}

    for (const [key, value] of Object.entries(route.query)) {
      if (keys.includes(key)) continue

      if (Array.isArray(value)) {
        const values = value.filter((item): item is string => typeof item === 'string')

        if (values.length > 0) {
          nextQuery[key] = values
        }

        continue
      }

      if (typeof value === 'string') {
        nextQuery[key] = value
      }
    }

    return nextQuery
  }

  function routeHasQuery(keys: string[], fullPath = route.fullPath): boolean {
    const queryString = fullPath.split('?')[1]?.split('#')[0] || ''

    if (queryString === '') return false

    const params = new URLSearchParams(queryString)

    return keys.some((key) => params.has(key))
  }

  function syncFromRoute() {
    if (!config) return

    syncingFromRoute.value = true

    for (const [key, field] of Object.entries(config.controls)) {
      mutableControls[key] = (
        field.fromRoute?.(route.query[key], field) ?? defaultFromRoute(route.query[key], field)
      )
    }

    void nextTick(() => {
      syncingFromRoute.value = false
    })
  }

  async function replaceRoute(nextQuery: RouteQuery = query.value) {
    if (syncingFromRoute.value) return

    await router.replace({
      path: route.path,
      query: cleanQuery(nextQuery),
    })
  }

  function setPage(value: number) {
    controls.page = Math.max(0, value)
    void replaceRoute()
  }

  function resetPage() {
    controls.page = 0
  }

  function resetControls() {
    if (!config) return

    for (const [key, field] of Object.entries(config.controls)) {
      mutableControls[key] = field.defaultValue
    }
  }

  const hasActiveControls = computed(() => {
    if (!config) return false

    return Object.entries(config.controls).some(([key, field]) => {
      if (key === 'page') return false

      const value = controls[key] ?? field.defaultValue

      return !(field.isDefault?.(value, field) ?? defaultIsDefault(value, field))
    })
  })

  return {
    controls,
    hasActiveControls,
    query,
    replaceRoute,
    resetControls,
    resetPage,
    routeHasQuery,
    routePageValue,
    routeQueryExcluding,
    routeQueryValue,
    setPage,
    syncFromRoute,
    syncingFromRoute,
  }
}
