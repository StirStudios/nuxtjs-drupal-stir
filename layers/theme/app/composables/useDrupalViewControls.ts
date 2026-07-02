import { computed, onBeforeUnmount, onMounted, ref, watch, watchEffect } from 'vue'
import type { CustomElementNode } from '~/types'

export interface ViewPager {
  current: number
  totalPages: number
}

interface RawViewPager {
  current?: unknown
  totalPages?: unknown
  total_pages?: unknown
}

export interface ExposedFilter {
  label: string
  queryParamName: string
  multiple?: boolean
  disabled?: boolean
  options?: Record<string, string> | string[]
  submittedValues?: unknown[]
}

export interface ExposedSort {
  label?: string
  sortByValue?: string
  submittedOrder?: string
  queryParamSortBy?: string
  queryParamSortOrder?: string
  sortOrderOptions?: Record<string, string>
}

interface ViewStateSnapshot {
  filters: Record<string, string | string[]>
  sorts: Record<string, string | string[]>
  page?: number
  savedAt?: number
}

interface NormalizedFilter {
  label: string
  queryParamName: string
  multiple?: boolean
  disabled?: boolean
  options: Array<{ label: string, value: string }>
}

interface UseDrupalViewControlsProps {
  viewId?: string
  displayId?: string
  parentUuid?: string
  pager?: ViewPager | unknown
  exposedFilters?: ExposedFilter[] | unknown[]
  exposedSorts?: ExposedSort[] | unknown[]
  noResults?: string
}

export function mapDrupalViewFilterOptions(
  options: Record<string, string> | string[] | undefined,
): Array<{ label: string; value: string }> {
  if (!options) return []

  if (Array.isArray(options)) {
    return options.map((label, index) => ({
      label,
      value: String(index),
    }))
  }

  return Object.entries(options).map(([value, label]) => ({ label, value }))
}

export function normalizeDrupalViewSortOrderValue(value: string): string {
  const normalized = value.trim().toLowerCase()

  if (normalized === 'asc') return 'ASC'
  if (normalized === 'desc') return 'DESC'

  return value
}

export function normalizeDrupalViewPager(pager: unknown): ViewPager | null {
  if (!pager || typeof pager !== 'object') return null

  const candidate = pager as RawViewPager
  const current = Number(candidate.current)
  const totalPages = Number(candidate.totalPages ?? candidate.total_pages)

  if (!Number.isFinite(current) || !Number.isFinite(totalPages)) return null

  return {
    current: Math.max(0, Math.trunc(current)),
    totalPages: Math.max(0, Math.trunc(totalPages)),
  }
}

function firstStringValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return String(value[0] ?? '')

  return String(value ?? '')
}

export function buildDrupalViewSearchParams(
  query: Record<string, string | string[]>,
): URLSearchParams {
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(query)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        params.append(key, item)
      }

      continue
    }

    params.set(key, value)
  }

  return params
}

export function getDrupalViewNodeProps(node: CustomElementNode): Record<string, unknown> {
  if (node.props && typeof node.props === 'object') {
    return node.props
  }

  const flat = { ...node }

  delete flat.element
  delete flat.props
  delete flat.slots

  return flat as Record<string, unknown>
}

export function getDrupalViewNodeSlots(node: CustomElementNode): Record<string, unknown> {
  if (node.slots && typeof node.slots === 'object') {
    return node.slots
  }

  return {}
}

export function getDrupalViewNodeRows(node: CustomElementNode): unknown[] {
  const slots = getDrupalViewNodeSlots(node)
  const slotRows = slots.rows

  if (Array.isArray(slotRows)) return slotRows

  const legacyRows = (node as Record<string, unknown>).rows

  if (Array.isArray(legacyRows)) return legacyRows

  return []
}

export function isSafeDrupalViewControlValue(value: string): boolean {
  return !/[?&][\w%.-]+=/u.test(value)
}

export function isValidDrupalViewFilterValue(
  filter: Pick<NormalizedFilter, 'options'>,
  value: string | string[],
): boolean {
  const values = Array.isArray(value) ? value : [value]
  const allowed = new Set(filter.options.map(option => option.value))

  return values.every(item => (
    isSafeDrupalViewControlValue(item) &&
    (allowed.size === 0 || allowed.has(item))
  ))
}

export function isDrupalViewAbortError(error: unknown): boolean {
  const message = String(
    (error as { message?: string })?.message || error || '',
  )
  const causeMessage = String(
    (error as { cause?: { message?: string } })?.cause?.message || '',
  )
  const abortMessage = `${message} ${causeMessage}`.toLowerCase()

  return (
    (error instanceof DOMException && error.name === 'AbortError') ||
    message.includes('AbortError') ||
    abortMessage.includes('operation was aborted') ||
    abortMessage.includes('request aborted')
  )
}

export function drupalViewLoadErrorMessage(error: unknown): string {
  const message = String(
    (error as { message?: string })?.message || error || '',
  )
  const isDrupalMemoryError =
    message.includes('Allowed memory size') ||
    message.includes('ApcuBackend.php')

  return isDrupalMemoryError
    ? 'Drupal ran out of memory while processing this view. Please try again or adjust backend memory/cache settings.'
    : 'Unable to load results. Please try again.'
}

export function isMatchingDrupalViewNode(
  node: CustomElementNode,
  criteria: Pick<UseDrupalViewControlsProps, 'displayId' | 'parentUuid' | 'viewId'> = {},
): boolean {
  const nodeProps = getDrupalViewNodeProps(node)
  const nodeViewId = String(nodeProps.viewId || '')
  const nodeDisplayId = String(nodeProps.displayId || '')
  const nodeParentUuid = String(nodeProps.parentUuid || '')
  const hasViewProps = nodeViewId.length > 0 || nodeDisplayId.length > 0
  const hasViewElement = Boolean(node.element?.startsWith('drupal-view-'))

  if (!hasViewProps && !hasViewElement) return false

  if (criteria.viewId && nodeViewId !== criteria.viewId) return false
  if (criteria.displayId && nodeDisplayId !== criteria.displayId) return false
  if (criteria.parentUuid && nodeParentUuid !== criteria.parentUuid) return false

  return true
}

export function findDrupalViewNode(
  input: unknown,
  criteria: Pick<UseDrupalViewControlsProps, 'displayId' | 'parentUuid' | 'viewId'> = {},
): CustomElementNode | null {
  if (!input) return null

  if (Array.isArray(input)) {
    for (const item of input) {
      const found = findDrupalViewNode(item, criteria)

      if (found) return found
    }

    return null
  }

  if (typeof input !== 'object') return null
  const node = input as CustomElementNode

  if (isMatchingDrupalViewNode(node, criteria)) return node

  const childCandidates: unknown[] = []
  const slots = getDrupalViewNodeSlots(node)

  if (Object.keys(slots).length > 0) {
    childCandidates.push(...Object.values(slots))
  }

  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (key === 'element' || key === 'props' || key === 'slots') continue
    childCandidates.push(value)
  }

  for (const child of childCandidates) {
    const found = findDrupalViewNode(child, criteria)

    if (found) return found
  }

  return null
}

export function findDrupalViewNodeInResponse(
  response: unknown,
  criteria: Pick<UseDrupalViewControlsProps, 'displayId' | 'parentUuid' | 'viewId'> = {},
): CustomElementNode | null {
  const responseRecord =
    response && typeof response === 'object'
      ? (response as Record<string, unknown>)
      : null
  const candidates = [
    response,
    responseRecord?.content,
    responseRecord?.items,
    responseRecord?.data,
  ]

  for (const candidate of candidates) {
    const viewNode = findDrupalViewNode(candidate, criteria)

    if (viewNode) return viewNode
  }

  return null
}

export function useDrupalViewControls(props: UseDrupalViewControlsProps) {
  const { $ceApi } = useDrupalCe()
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
    return [
      'stir:view-controls',
      path,
      props.viewId || '',
      props.displayId || '',
      props.parentUuid || '',
    ].join(':')
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
    effectiveFilters.value
      .map((filter) => filter as ExposedFilter)
      .filter(
        (filter) =>
          !!filter.queryParamName &&
          !!filter.label &&
          filter.options &&
          typeof filter.options === 'object',
      )
      .map((filter) => ({
        label: filter.label,
        queryParamName: filter.queryParamName,
        multiple: filter.multiple,
        disabled: filter.disabled,
        options: mapDrupalViewFilterOptions(filter.options),
      })),
  )

  const primarySort = computed<ExposedSort | null>(() => {
    const [firstSort] = effectiveSorts.value

    if (!firstSort?.queryParamSortBy || !firstSort?.queryParamSortOrder) {
      return null
    }

    return firstSort
  })

  const sortByOptions = computed(() => {
    if (!primarySort.value?.sortByValue) return []
    return [
      {
        label: primarySort.value.label || primarySort.value.sortByValue,
        value: primarySort.value.sortByValue,
      },
    ]
  })

  const sortOrderOptions = computed(() =>
    Object.entries(primarySort.value?.sortOrderOptions ?? {}).map(
      ([value, label]) => ({ label, value }),
    ),
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
    const filtersSnapshot: Record<string, string | string[]> = {}

    for (const [key, value] of Object.entries(filterValues.value)) {
      filtersSnapshot[key] = Array.isArray(value) ? [...value] : value
    }

    const sortsSnapshot: Record<string, string | string[]> = {}

    for (const [key, value] of Object.entries(sortValues.value)) {
      sortsSnapshot[key] = Array.isArray(value) ? [...value] : value
    }

    return {
      filters: filtersSnapshot,
      sorts: sortsSnapshot,
      page,
      savedAt: Date.now(),
    }
  }

  function defaultViewStateSnapshot(): ViewStateSnapshot {
    const filtersSnapshot: Record<string, string | string[]> = {}

    for (const filter of normalizedFilters.value) {
      const source = effectiveFilters.value.find(
        (item) => item.queryParamName === filter.queryParamName,
      )

      filtersSnapshot[filter.queryParamName] = defaultValueForFilter(filter, source)
    }

    const sortsSnapshot: Record<string, string | string[]> = {}
    const sort = primarySort.value

    if (sort?.queryParamSortBy) {
      sortsSnapshot[sort.queryParamSortBy] = sort.sortByValue || ''
    }

    if (sort?.queryParamSortOrder) {
      sortsSnapshot[sort.queryParamSortOrder] = sort.submittedOrder || ''
    }

    return {
      filters: filtersSnapshot,
      sorts: sortsSnapshot,
      page: 0,
      savedAt: Date.now(),
    }
  }

  function defaultValueForFilter(filter: { queryParamName: string, multiple?: boolean }, source?: ExposedFilter): string | string[] {
    const submitted = source?.submittedValues ?? []

    if (filter.multiple) {
      return submitted.map((value) => String(value))
    }

    return String(submitted[0] ?? '')
  }

  function validFilterValue(filter: NormalizedFilter, value: string | string[]): boolean {
    return isValidDrupalViewFilterValue(filter, value)
  }

  function defaultSortByValue(sort: ExposedSort): string {
    return sort.sortByValue || ''
  }

  function defaultSortOrderValue(sort: ExposedSort): string {
    return sort.submittedOrder || ''
  }

  function validSortByValues(): Set<string> {
    return new Set(sortByOptions.value.map(option => option.value))
  }

  function validSortOrderValues(sort: ExposedSort): Set<string> {
    const values = new Set<string>()

    for (const option of sortOrderOptions.value) {
      values.add(option.value)
      values.add(normalizeDrupalViewSortOrderValue(option.value))
    }

    const submitted = defaultSortOrderValue(sort)

    if (submitted) {
      values.add(submitted)
      values.add(normalizeDrupalViewSortOrderValue(submitted))
    }

    return values
  }

  function validSortByValue(sort: ExposedSort, value: string): boolean {
    if (!value || !isSafeDrupalViewControlValue(value)) return false

    const values = validSortByValues()

    return values.size === 0 || values.has(value)
  }

  function validSortOrderValue(sort: ExposedSort, value: string): boolean {
    if (!value || !isSafeDrupalViewControlValue(value)) return false

    return validSortOrderValues(sort).has(value)
  }

  function routeValueForSortBy(sort: ExposedSort): string {
    const key = sort.queryParamSortBy
    const fallback = defaultSortByValue(sort)

    if (!key) return fallback

    const value = firstStringValue(routeQueryValue(key))

    return validSortByValue(sort, value) ? value : fallback
  }

  function routeValueForSortOrder(sort: ExposedSort): string {
    const key = sort.queryParamSortOrder
    const fallback = defaultSortOrderValue(sort)

    if (!key) return fallback

    const value = firstStringValue(routeQueryValue(key))

    return validSortOrderValue(sort, value) ? value : fallback
  }

  function sanitizeStoredSorts(
    sorts: ViewStateSnapshot['sorts'] | undefined,
  ): ViewStateSnapshot['sorts'] | null {
    const sort = primarySort.value

    if (!sort) return {}

    const sanitized: ViewStateSnapshot['sorts'] = {}

    if (sort.queryParamSortBy) {
      const value = Object.prototype.hasOwnProperty.call(
        sorts ?? {},
        sort.queryParamSortBy,
      )
        ? firstStringValue(sorts?.[sort.queryParamSortBy])
        : defaultSortByValue(sort)

      if (!validSortByValue(sort, value)) return null

      sanitized[sort.queryParamSortBy] = value
    }

    if (sort.queryParamSortOrder) {
      const value = Object.prototype.hasOwnProperty.call(
        sorts ?? {},
        sort.queryParamSortOrder,
      )
        ? firstStringValue(sorts?.[sort.queryParamSortOrder])
        : defaultSortOrderValue(sort)

      if (!validSortOrderValue(sort, value)) return null

      sanitized[sort.queryParamSortOrder] = value
    }

    return sanitized
  }

  function sanitizeStoredFilters(
    filters: ViewStateSnapshot['filters'] | undefined,
  ): ViewStateSnapshot['filters'] | null {
    const sanitized: ViewStateSnapshot['filters'] = {}

    for (const filter of normalizedFilters.value) {
      const source = effectiveFilters.value.find(
        (item) => item.queryParamName === filter.queryParamName,
      )
      const value = Object.prototype.hasOwnProperty.call(
        filters ?? {},
        filter.queryParamName,
      )
        ? filters?.[filter.queryParamName] ?? defaultValueForFilter(filter, source)
        : defaultValueForFilter(filter, source)

      if (!validFilterValue(filter, value)) return null

      sanitized[filter.queryParamName] = value
    }

    return sanitized
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

    try {
      const data = JSON.parse(stored) as ViewStateSnapshot
      const savedAt = typeof data.savedAt === 'number' ? data.savedAt : 0

      if (Date.now() - savedAt > 30 * 60 * 1000) {
        sessionStorage.removeItem(viewStateStorageKeyFor())
        return null
      }

      return data
    }
    catch {
      sessionStorage.removeItem(viewStateStorageKeyFor())
      return null
    }
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
    const keys = ['page']

    for (const filter of normalizedFilters.value) {
      keys.push(filter.queryParamName, `${filter.queryParamName}[]`)
    }

    const sort = primarySort.value

    if (sort?.queryParamSortBy) {
      keys.push(sort.queryParamSortBy, `${sort.queryParamSortBy}[]`)
    }

    if (sort?.queryParamSortOrder) {
      keys.push(sort.queryParamSortOrder, `${sort.queryParamSortOrder}[]`)
    }

    return keys
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

  function routeValueForFilter(filter: NormalizedFilter, source?: ExposedFilter): string | string[] {
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
    const query: Record<string, string | string[]> = {}

    for (const filter of normalizedFilters.value) {
      const value = filterValues.value[filter.queryParamName]

      if (Array.isArray(value)) {
        if (value.length > 0 && validFilterValue(filter, value)) {
          query[`${filter.queryParamName}[]`] = value
        }

        continue
      }
      if (
        typeof value === 'string' &&
        value.length > 0 &&
        validFilterValue(filter, value)
      ) {
        query[filter.queryParamName] = value
      }
    }

    const sort = primarySort.value

    if (sort?.queryParamSortBy) {
      const value = sortValues.value[sort.queryParamSortBy]

      if (
        typeof value === 'string' &&
        value.length > 0 &&
        validSortByValue(sort, value)
      ) {
        query[sort.queryParamSortBy] = value
      }
    }

    if (sort?.queryParamSortOrder) {
      const value = sortValues.value[sort.queryParamSortOrder]

      if (
        typeof value === 'string' &&
        value.length > 0 &&
        validSortOrderValue(sort, value)
      ) {
        query[sort.queryParamSortOrder] = normalizeDrupalViewSortOrderValue(value)
      }
    }

    if (page > 0) {
      query.page = String(page)
    }

    return query
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
