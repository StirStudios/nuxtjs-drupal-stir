import type { MaybeRefOrGetter } from 'vue'

type DynamicListingFilterOption = {
  value: number | string
  label: string
  filterLabel?: string
  type?: string
}

type DynamicListingFilters = Record<string, DynamicListingFilterOption[] | undefined>

type DynamicListingChipType = 'date_range' | 'facet' | 'search' | 'sort'

type DynamicListingChip = {
  key: string
  label: string
  prefix: string
  type: DynamicListingChipType
  filterKey?: string
  value: string
}

type DynamicListingSortOption = {
  label: string
  value: string
}

type DynamicListingControlsOptions = {
  excludedFilterKeys?: string[]
  filters: MaybeRefOrGetter<DynamicListingFilters | undefined>
  fixedQuery?: MaybeRefOrGetter<Partial<Record<string, string[]>> | undefined>
  pageQueryKey?: string
  searchQueryKey?: string
  sortOptions?: DynamicListingSortOption[]
  sortQueryKey?: string
  defaultSort?: string
}

function routeArrayValue(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean)
  if (typeof value === 'string') return value.split(',').map(item => item.trim()).filter(Boolean)

  return []
}

function routeStringValue(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function normalizeSelectValues(values: string | string[]): string[] {
  return Array.isArray(values) ? values : [values].filter(Boolean)
}

export function useDynamicListingControls(options: DynamicListingControlsOptions) {
  const route = useRoute()
  const router = useRouter()
  const searchQueryKey = options.searchQueryKey || 'search'
  const sortQueryKey = options.sortQueryKey || 'sort'
  const pageQueryKey = options.pageQueryKey || 'page'
  const defaultSort = options.defaultSort || 'daily:asc'
  const excludedFilterKeys = new Set([
    sortQueryKey,
    'sort_by',
    'sort_order',
    searchQueryKey,
    pageQueryKey,
    ...(options.excludedFilterKeys || []),
  ])

  const search = ref('')
  const sort = ref(defaultSort)
  const page = ref(0)
  const selectedFilters = reactive<Record<string, string[]>>({})
  const syncingFromRoute = ref(false)
  const filters = computed(() => toValue(options.filters) || {})
  const fixedQuery = computed(() => toValue(options.fixedQuery) || {})
  const filterKeys = computed(() => Object.keys(filters.value).filter(key => !excludedFilterKeys.has(key)))
  const facetKeys = computed(() => filterKeys.value.filter(key => !isDateRangeKey(key)))

  const hasFilters = computed(() => {
    if (search.value.trim() || sort.value !== defaultSort) return true

    return Object.keys(selectedFilters).some(key => activeFilterValues(key, true).length > 0)
  })

  const activeFilterChips = computed<DynamicListingChip[]>(() => {
    const chips: DynamicListingChip[] = []

    if (search.value.trim()) {
      chips.push({
        key: searchQueryKey,
        label: search.value.trim(),
        prefix: 'Search',
        type: 'search',
        value: search.value.trim(),
      })
    }

    for (const key of facetKeys.value) {
      const options = facetOptions(key)

      for (const value of activeFilterValues(key, true)) {
        chips.push({
          key: `${key}:${value}`,
          label: options.find(option => option.value === value)?.label || value,
          prefix: filterLabel(key),
          type: 'facet',
          filterKey: key,
          value,
        })
      }
    }

    for (const key of filterKeys.value.filter(isDateRangeKey)) {
      const values = activeFilterValues(key)

      if (values.length) {
        chips.push({
          key,
          label: values.join(' - '),
          prefix: filterLabel(key),
          type: 'date_range',
          filterKey: key,
          value: values.join(','),
        })
      }
    }

    if (sort.value !== defaultSort) {
      chips.push({
        key: sortQueryKey,
        label: options.sortOptions?.find(option => option.value === sort.value)?.label || sort.value,
        prefix: 'Sort',
        type: 'sort',
        value: sort.value,
      })
    }

    return chips
  })

  function filterOptions(key: string): DynamicListingFilterOption[] {
    const options = filters.value[key]

    return Array.isArray(options) ? options : []
  }

  function facetOptions(key: string) {
    return filterOptions(key).map(option => ({
      label: option.label,
      value: String(option.value),
    }))
  }

  function filterLabel(key: string): string {
    return filterOptions(key)[0]?.filterLabel || filterOptions(key)[0]?.label || key.replaceAll('_', ' ')
  }

  function isDateRangeKey(key: string): boolean {
    return filterOptions(key).some(option => option.type === 'date_range')
  }

  function activeFilterValues(key: string, excludeFixed = false): string[] {
    const values = selectedFilters[key] || []
    const fixed = excludeFixed ? fixedQuery.value[key] || [] : []

    return values.filter(value => !fixed.includes(value))
  }

  function updateFilterValues(key: string, values: string | string[]) {
    selectedFilters[key] = normalizeSelectValues(values)
    resetPage()
    void replaceRoute()
  }

  function isFacetDisabled(key: string): boolean {
    return activeFilterValues(key).length === 0 && facetOptions(key).length <= 1
  }

  function applyFixedQueryDefaults() {
    for (const [key, values] of Object.entries(fixedQuery.value)) {
      if (!selectedFilters[key]?.length && values?.length) {
        selectedFilters[key] = [...values]
      }
    }
  }

  function routeQuery() {
    const query: Record<string, string> = {}

    if (search.value.trim()) query[searchQueryKey] = search.value.trim()
    if (sort.value !== defaultSort) query[sortQueryKey] = sort.value
    if (page.value > 0) query[pageQueryKey] = String(page.value)

    for (const [key, values] of Object.entries(selectedFilters)) {
      if (values.length) query[key] = values.join(',')
    }

    return query
  }

  async function replaceRoute() {
    if (syncingFromRoute.value) return

    await router.replace({
      path: route.path,
      query: routeQuery(),
    })
  }

  function resetPage() {
    page.value = 0
  }

  function setPage(value: number) {
    page.value = Math.max(0, value)
    void replaceRoute()
  }

  function resetFilters() {
    search.value = ''
    sort.value = defaultSort
    resetPage()

    for (const key of Object.keys(selectedFilters)) {
      selectedFilters[key] = []
    }

    applyFixedQueryDefaults()
    void replaceRoute()
  }

  function removeFilterChip(chip: DynamicListingChip) {
    if (chip.type === 'search') {
      search.value = ''
    }
    else if (chip.type === 'sort') {
      sort.value = defaultSort
    }
    else if (chip.filterKey) {
      selectedFilters[chip.filterKey] = chip.type === 'date_range'
        ? []
        : activeFilterValues(chip.filterKey).filter(value => value !== chip.value)
    }

    resetPage()
    void replaceRoute()
  }

  function syncFromRoute() {
    syncingFromRoute.value = true
    search.value = routeStringValue(route.query[searchQueryKey])
    sort.value = routeStringValue(route.query[sortQueryKey]) || defaultSort
    page.value = Math.max(0, Number.parseInt(routeStringValue(route.query[pageQueryKey]) || '0', 10) || 0)

    for (const key of Object.keys(selectedFilters)) {
      selectedFilters[key] = []
    }

    for (const [key, value] of Object.entries(route.query)) {
      if (excludedFilterKeys.has(key)) continue

      selectedFilters[key] = routeArrayValue(value)
    }

    applyFixedQueryDefaults()

    void nextTick(() => {
      syncingFromRoute.value = false
    })
  }

  watch([search, sort], () => {
    if (syncingFromRoute.value) return
    resetPage()
    void replaceRoute()
  })

  syncFromRoute()
  applyFixedQueryDefaults()

  return {
    activeFilterChips,
    activeFilterValues,
    applyFixedQueryDefaults,
    facetKeys,
    facetOptions,
    filterKeys,
    filterLabel,
    filterOptions,
    filters,
    hasFilters,
    isDateRangeKey,
    isFacetDisabled,
    page,
    removeFilterChip,
    replaceRoute,
    resetFilters,
    resetPage,
    routeArrayValue,
    routeQuery,
    routeStringValue,
    search,
    selectedFilters,
    setPage,
    sort,
    syncFromRoute,
    syncingFromRoute,
    updateFilterValues,
  }
}

export type {
  DynamicListingChip,
  DynamicListingChipType,
  DynamicListingControlsOptions,
  DynamicListingFilterOption,
  DynamicListingFilters,
  DynamicListingSortOption,
}
