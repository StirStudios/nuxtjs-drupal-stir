import { computed, onBeforeUnmount, onMounted, ref, watch, watchEffect } from 'vue'
import {
  buildDrupalViewControlQuery,
  buildDrupalViewSearchParams,
  drupalViewManagedQueryKeys,
  isValidDrupalViewFilterValue,
  isValidDrupalViewSortByValue,
  isValidDrupalViewSortOrderValue,
  mapDrupalViewSortByOptions,
  mapDrupalViewSortOrderOptions,
  normalizeDrupalViewFilters,
  normalizeDrupalViewPager,
  primaryDrupalViewSort,
} from '~/composables/useDrupalViewQuery'
import type { NormalizedViewFilter, ViewPager } from '~/composables/useDrupalViewQuery'
import {
  drupalViewLoadErrorMessage,
  isDrupalViewAbortError,
} from '~/composables/useDrupalViewErrors'
import {
  findDrupalViewNodeInResponse,
  getDrupalViewNodeProps,
  getDrupalViewNodeRows,
} from '~/composables/useDrupalViewNode'
import type { ExposedFilter, ExposedSort } from '~/types/View'
import {
  createDefaultDrupalViewState,
  createViewStateSnapshot,
  createViewStateStorageKey,
  defaultDrupalViewFilterValue,
  firstViewControlString,
  parseStoredViewState,
  sanitizeDrupalViewStoredFilters,
  sanitizeDrupalViewStoredSorts,
} from '~/utils/drupalViewState'
import type { ViewStateSnapshot } from '~/utils/drupalViewState'

export type { ExposedFilter, ExposedSort } from '~/types/View'

interface UseDrupalViewControlsProps {
  viewId?: string
  displayId?: string
  parentUuid?: string
  pager?: ViewPager | unknown
  exposedFilters?: ExposedFilter[] | unknown[]
  exposedSorts?: ExposedSort[] | unknown[]
  noResults?: string
}

export function useDrupalViewControls(props: UseDrupalViewControlsProps) {
  const { $ceApi } = useStirDrupalCe()
  const route = useRoute()
  const routeControls = useRouteListControls()

  const isLoading = ref(false)
  const loadError = ref('')
  const dynamicRows = ref<unknown[] | null>(null)
  const dynamicPager = ref<ViewPager | null>(null)
  const dynamicFilters = ref<ExposedFilter[] | null>(null)
  const dynamicSorts = ref<ExposedSort[] | null>(null)
  const dynamicNoResults = ref('')

  const filterValues = ref<Record<string, string | string[]>>({})
  const sortValues = ref<Record<string, string | string[]>>({})
  const currentPage = ref(0)
  const defaultViewState = ref<ViewStateSnapshot | null>(null)
  const refreshDebounceMs = 200
  let refreshTimer: ReturnType<typeof setTimeout> | null = null
  let activeRequestId = 0
  let activeAbortController: AbortController | null = null
  let suppressNextRouteRefresh = false

  function viewStateStorageKeyFor(path = route.path): string {
    return createViewStateStorageKey({
      path,
      viewId: props.viewId,
      displayId: props.displayId,
      parentUuid: props.parentUuid,
    })
  }

  function routeQueryValue(key: string): string | string[] | undefined {
    return routeControls.routeQueryValue(key)
  }

  const defaultNoResultsMessage = computed(
    () =>
      props.noResults ||
      String((props as Record<string, unknown>).no_results || ''),
  )

  const effectiveFilters = computed(
    () =>
      dynamicFilters.value ?? ((props.exposedFilters ?? []) as ExposedFilter[]),
  )
  const effectiveSorts = computed(
    () => dynamicSorts.value ?? ((props.exposedSorts ?? []) as ExposedSort[]),
  )
  const effectivePager = computed<ViewPager | null>(() => {
    if (dynamicPager.value) return dynamicPager.value

    return normalizeDrupalViewPager(props.pager)
  })

  const normalizedFilters = computed(() =>
    normalizeDrupalViewFilters(effectiveFilters.value),
  )

  const primarySort = computed(() => primaryDrupalViewSort(effectiveSorts.value))
  const sortByOptions = computed(() => mapDrupalViewSortByOptions(primarySort.value))

  const sortOrderOptions = computed(() =>
    mapDrupalViewSortOrderOptions(primarySort.value),
  )

  const hasControls = computed(
    () => normalizedFilters.value.length > 0 || sortOrderOptions.value.length > 0,
  )

  watchEffect(() => {
    for (const filter of normalizedFilters.value) {
      if (filter.queryParamName in filterValues.value) continue

      const source = effectiveFilters.value.find(
        (item) => item.queryParamName === filter.queryParamName,
      )
      const submitted = source?.submittedValues ?? []
      const routeValue = routeQueryValue(filter.queryParamName)

      if (filter.multiple) {
        filterValues.value[filter.queryParamName] = Array.isArray(routeValue)
          ? routeValue
          : routeValue
            ? [routeValue]
            : submitted.map((value) => String(value))
      } else {
        filterValues.value[filter.queryParamName] = Array.isArray(routeValue)
          ? String(routeValue[0] ?? '')
          : String(routeValue ?? submitted[0] ?? '')
      }
    }
  })

  watchEffect(() => {
    const sort = primarySort.value

    if (!sort) return

    if (sort.queryParamSortBy && !(sort.queryParamSortBy in sortValues.value)) {
      sortValues.value[sort.queryParamSortBy] = routeValueForSortBy(sort)
    }

    if (
      sort.queryParamSortOrder &&
      !(sort.queryParamSortOrder in sortValues.value)
    ) {
      sortValues.value[sort.queryParamSortOrder] = routeValueForSortOrder(sort)
    }
  })

  watch(
    () => effectivePager.value?.current,
    (value) => {
      if (typeof value === 'number') {
        currentPage.value = routePageValue() ?? value
      }
    },
    { immediate: true },
  )

  function routePageValue(): number | null {
    return routeControls.routePageValue()
  }

  function snapshotCurrentViewState(page = currentPage.value): ViewStateSnapshot {
    return createViewStateSnapshot(
      filterValues.value,
      sortValues.value,
      page,
    )
  }

  function defaultViewStateSnapshot(): ViewStateSnapshot {
    return createDefaultDrupalViewState({
      filters: normalizedFilters.value,
      exposedFilters: effectiveFilters.value,
      sort: primarySort.value,
    })
  }

  function defaultValueForFilter(filter: { queryParamName: string, multiple?: boolean }, source?: ExposedFilter): string | string[] {
    return defaultDrupalViewFilterValue(filter, source)
  }

  function validFilterValue(filter: NormalizedViewFilter, value: string | string[]): boolean {
    return isValidDrupalViewFilterValue(filter, value)
  }

  function defaultSortByValue(sort: ExposedSort): string {
    return sort.sortByValue || ''
  }

  function defaultSortOrderValue(sort: ExposedSort): string {
    return sort.submittedOrder || ''
  }

  function validSortByValue(sort: ExposedSort, value: string): boolean {
    return isValidDrupalViewSortByValue(value, sortByOptions.value)
  }

  function validSortOrderValue(sort: ExposedSort, value: string): boolean {
    return isValidDrupalViewSortOrderValue(sort, value, sortOrderOptions.value)
  }

  function routeValueForSortBy(sort: ExposedSort): string {
    const key = sort.queryParamSortBy
    const fallback = defaultSortByValue(sort)

    if (!key) return fallback

    const value = firstViewControlString(routeQueryValue(key))

    return validSortByValue(sort, value) ? value : fallback
  }

  function routeValueForSortOrder(sort: ExposedSort): string {
    const key = sort.queryParamSortOrder
    const fallback = defaultSortOrderValue(sort)

    if (!key) return fallback

    const value = firstViewControlString(routeQueryValue(key))

    return validSortOrderValue(sort, value) ? value : fallback
  }

  function sanitizeStoredSorts(
    sorts: ViewStateSnapshot['sorts'] | undefined,
  ): ViewStateSnapshot['sorts'] | null {
    return sanitizeDrupalViewStoredSorts({
      sorts,
      sort: primarySort.value,
      sortByOptions: sortByOptions.value,
      sortOrderOptions: sortOrderOptions.value,
    })
  }

  function sanitizeStoredFilters(
    filters: ViewStateSnapshot['filters'] | undefined,
  ): ViewStateSnapshot['filters'] | null {
    return sanitizeDrupalViewStoredFilters({
      filters,
      definitions: normalizedFilters.value,
      exposedFilters: effectiveFilters.value,
    })
  }

  function saveViewState(page = currentPage.value): void {
    if (!import.meta.client) return

    sessionStorage.setItem(
      viewStateStorageKeyFor(),
      JSON.stringify(snapshotCurrentViewState(page)),
    )
  }

  function storedViewState(): ViewStateSnapshot | null {
    if (!import.meta.client) return null

    const stored = sessionStorage.getItem(viewStateStorageKeyFor())

    if (!stored) return null

    const data = parseStoredViewState(stored)

    if (!data) {
      sessionStorage.removeItem(viewStateStorageKeyFor())
      return null
    }

    return data
  }

  function applyStoredStateToControls(): number | null {
    const stored = storedViewState()

    if (!stored) return null

    const sanitizedFilters = sanitizeStoredFilters(stored.filters)
    const sanitizedSorts = sanitizeStoredSorts(stored.sorts)

    if (!sanitizedFilters || !sanitizedSorts) {
      if (import.meta.client) {
        sessionStorage.removeItem(viewStateStorageKeyFor())
      }

      return null
    }

    filterValues.value = {
      ...filterValues.value,
      ...sanitizedFilters,
    }
    sortValues.value = {
      ...sortValues.value,
      ...sanitizedSorts,
    }

    const page = typeof stored.page === 'number' && stored.page > 0
      ? stored.page
      : 0

    currentPage.value = page

    return page
  }

  function managedQueryKeys(): string[] {
    return drupalViewManagedQueryKeys(normalizedFilters.value, primarySort.value)
  }

  function syncUrlQuery(page: number): void {
    if (!import.meta.client) return

    suppressNextRouteRefresh = true

    const nextQuery = {
      ...routeControls.routeQueryExcluding(managedQueryKeys()),
      ...buildQueryParams(page),
    }

    saveViewState(page)

    void routeControls.replaceRoute(nextQuery).finally(() => {
      suppressNextRouteRefresh = false
    })
  }

  function routeHasManagedQuery(fullPath = route.fullPath): boolean {
    return routeControls.routeHasQuery(managedQueryKeys(), fullPath)
  }

  function routeValueForFilter(filter: NormalizedViewFilter, source?: ExposedFilter): string | string[] {
    const routeValue = routeQueryValue(filter.queryParamName)
    const defaultValue = defaultValueForFilter(filter, source)
    let value: string | string[]

    if (filter.multiple) {
      if (Array.isArray(routeValue)) {
        value = routeValue
      } else if (routeValue) {
        value = [routeValue]
      } else {
        value = defaultValue
      }

      return validFilterValue(filter, value) ? value : defaultValue
    }

    value = Array.isArray(routeValue)
      ? String(routeValue[0] ?? '')
      : String(routeValue ?? defaultValue)

    return validFilterValue(filter, value) ? value : defaultValue
  }

  function applyRouteStateToControls(): number {
    for (const filter of normalizedFilters.value) {
      const source = effectiveFilters.value.find(
        (item) => item.queryParamName === filter.queryParamName,
      )

      filterValues.value[filter.queryParamName] = routeValueForFilter(filter, source)
    }

    const sort = primarySort.value

    if (sort?.queryParamSortBy) {
      sortValues.value[sort.queryParamSortBy] = routeValueForSortBy(sort)
    }

    if (sort?.queryParamSortOrder) {
      sortValues.value[sort.queryParamSortOrder] = routeValueForSortOrder(sort)
    }

    const page = routePageValue() ?? 0

    currentPage.value = page

    return page
  }

  function buildQueryParams(page: number): Record<string, string | string[]> {
    return buildDrupalViewControlQuery({
      filters: normalizedFilters.value,
      filterValues: filterValues.value,
      sort: primarySort.value,
      sortValues: sortValues.value,
      sortByOptions: sortByOptions.value,
      sortOrderOptions: sortOrderOptions.value,
      page,
    })
  }

  async function refreshView(page = currentPage.value) {
    if (!import.meta.client) return

    const requestId = ++activeRequestId

    activeAbortController?.abort()
    activeAbortController = new AbortController()

    isLoading.value = true
    loadError.value = ''
    dynamicNoResults.value = defaultNoResultsMessage.value

    try {
      const query = buildQueryParams(page)
      const params = buildDrupalViewSearchParams(query)
      const queryString = params.toString()
      const requestPath = `${route.path}${queryString ? `?${queryString}` : ''}`

      const api = $ceApi()
      const pageResponse = await api(requestPath, {
        signal: activeAbortController.signal,
      })
      const viewNode = findDrupalViewNodeInResponse(pageResponse, props)

      if (requestId !== activeRequestId) return

      if (!viewNode) {
        dynamicRows.value = []
        dynamicPager.value = {
          current: page,
          totalPages: 1,
        }
        dynamicFilters.value = effectiveFilters.value
        dynamicSorts.value = effectiveSorts.value
        dynamicNoResults.value = defaultNoResultsMessage.value
        loadError.value = ''
        return
      }

      const viewNodeProps = getDrupalViewNodeProps(viewNode)

      dynamicRows.value = getDrupalViewNodeRows(viewNode)
      dynamicPager.value = normalizeDrupalViewPager(viewNodeProps.pager) ?? {
        current: page,
        totalPages: 1,
      }
      dynamicFilters.value =
        (viewNodeProps.exposedFilters as ExposedFilter[]) ??
        effectiveFilters.value
      dynamicSorts.value =
        (viewNodeProps.exposedSorts as ExposedSort[]) ?? effectiveSorts.value
      dynamicNoResults.value = String(
        viewNodeProps.noResults ?? viewNodeProps.no_results ?? '',
      )

      currentPage.value = dynamicPager.value.current
    } catch (error) {
      if (requestId !== activeRequestId) return

      if (isDrupalViewAbortError(error)) return

      loadError.value = drupalViewLoadErrorMessage(error)

      console.error('Failed to refresh Drupal view:', error)
    } finally {
      if (requestId === activeRequestId) {
        activeAbortController = null
        isLoading.value = false
      }
    }
  }

  function scheduleRefresh(page = currentPage.value) {
    if (refreshTimer) {
      clearTimeout(refreshTimer)
    }

    refreshTimer = setTimeout(() => {
      refreshTimer = null
      void refreshView(page)
    }, refreshDebounceMs)
  }

  function retryCurrentPage() {
    scheduleRefresh(currentPage.value)
  }

  function onFilterChange(payload: { key: string; value: string | string[] }) {
    filterValues.value[payload.key] = payload.value
    currentPage.value = 0
    saveViewState(0)
    syncUrlQuery(0)
    scheduleRefresh(0)
  }

  function onSortChange(payload: { key: string; value: string }) {
    sortValues.value[payload.key] = payload.value
    currentPage.value = 0
    saveViewState(0)
    syncUrlQuery(0)
    scheduleRefresh(0)
  }

  function onPageChange(value: number) {
    currentPage.value = value
    saveViewState(value)
    syncUrlQuery(value)
    void refreshView(value)
  }

  function captureDefaultViewState() {
    if (defaultViewState.value) return

    defaultViewState.value = defaultViewStateSnapshot()
  }

  function resetControls() {
    const defaults = defaultViewState.value

    if (!defaults) return

    filterValues.value = {
      ...defaults.filters,
    }
    sortValues.value = {
      ...defaults.sorts,
    }
    currentPage.value = 0
    saveViewState(0)
    syncUrlQuery(0)
    scheduleRefresh(0)
  }

  watch(
    () => route.fullPath,
    (fullPath, oldFullPath) => {
      if (!import.meta.client || !oldFullPath || fullPath === oldFullPath) return

      if (suppressNextRouteRefresh) {
        suppressNextRouteRefresh = false
        return
      }

      if (!routeHasManagedQuery(fullPath) && !routeHasManagedQuery(oldFullPath)) return

      const page = applyRouteStateToControls()

      void refreshView(page)
    },
  )

  onMounted(() => {
    captureDefaultViewState()

    if (routeHasManagedQuery()) {
      applyRouteStateToControls()
      return
    }

    const storedPage = applyStoredStateToControls()

    if (storedPage !== null && storedPage > 0) {
      void refreshView(storedPage)
    }
  })

  onBeforeUnmount(() => {
    saveViewState()
    activeAbortController?.abort()

    if (refreshTimer) {
      clearTimeout(refreshTimer)
      refreshTimer = null
    }
  })

  return {
    isLoading,
    loadError,
    dynamicRows,
    dynamicNoResults,
    filterValues,
    sortValues,
    currentPage,
    effectivePager,
    normalizedFilters,
    primarySort,
    sortByOptions,
    sortOrderOptions,
    hasControls,
    refreshView,
    retryCurrentPage,
    onFilterChange,
    onSortChange,
    onPageChange,
    resetControls,
  }
}
