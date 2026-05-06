import { computed, onBeforeUnmount, onMounted, ref, watch, watchEffect } from 'vue'

export interface ViewPager {
  current: number
  totalPages: number
}

export interface ExposedFilter {
  label: string
  queryParamName: string
  multiple?: boolean
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

interface CeElementNode {
  element?: string
  props?: Record<string, unknown>
  slots?: Record<string, unknown>
  [key: string]: unknown
}

interface ViewStateSnapshot {
  filters: Record<string, string | string[]>
  sorts: Record<string, string | string[]>
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

function mapFilterOptions(
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

function normalizeSortOrderValue(value: string): string {
  const normalized = value.trim().toLowerCase()

  if (normalized === 'asc') return 'ASC'
  if (normalized === 'desc') return 'DESC'

  return value
}

function buildSearchParams(
  query: Record<string, string | string[]>,
): URLSearchParams {
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(query)) {
    if (Array.isArray(value)) {
      const paramKey = key.endsWith('[]') ? key : `${key}[]`

      for (const item of value) {
        params.append(paramKey, item)
      }

      continue
    }

    params.set(key, value)
  }

  return params
}

function getNodeProps(node: CeElementNode): Record<string, unknown> {
  if (node.props && typeof node.props === 'object') {
    return node.props
  }

  const flat = { ...node }

  delete flat.element
  delete flat.props
  delete flat.slots

  return flat as Record<string, unknown>
}

function getNodeSlots(node: CeElementNode): Record<string, unknown> {
  if (node.slots && typeof node.slots === 'object') {
    return node.slots
  }

  return {}
}

function getNodeRows(node: CeElementNode): unknown[] {
  const slots = getNodeSlots(node)
  const slotRows = slots.rows

  if (Array.isArray(slotRows)) return slotRows

  const legacyRows = (node as Record<string, unknown>).rows

  if (Array.isArray(legacyRows)) return legacyRows

  return []
}

export function useDrupalViewControls(props: UseDrupalViewControlsProps) {
  const { $ceApi } = useDrupalCe()
  const route = useRoute()

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
    const candidate = props.pager as Partial<ViewPager> | undefined

    if (
      !candidate ||
      typeof candidate.current !== 'number' ||
      typeof candidate.totalPages !== 'number'
    ) {
      return null
    }

    return {
      current: Math.max(0, candidate.current),
      totalPages: Math.max(0, candidate.totalPages),
    }
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
        options: mapFilterOptions(filter.options),
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

      if (filter.multiple) {
        filterValues.value[filter.queryParamName] = submitted.map((value) =>
          String(value),
        )
      } else {
        filterValues.value[filter.queryParamName] = String(submitted[0] ?? '')
      }
    }
  })

  watchEffect(() => {
    const sort = primarySort.value

    if (!sort) return

    if (sort.queryParamSortBy && !(sort.queryParamSortBy in sortValues.value)) {
      sortValues.value[sort.queryParamSortBy] = sort.sortByValue || ''
    }

    if (
      sort.queryParamSortOrder &&
      !(sort.queryParamSortOrder in sortValues.value)
    ) {
      sortValues.value[sort.queryParamSortOrder] = sort.submittedOrder || ''
    }
  })

  watch(
    () => effectivePager.value?.current,
    (value) => {
      if (typeof value === 'number') {
        currentPage.value = value
      }
    },
    { immediate: true },
  )

  function buildQueryParams(page: number): Record<string, string | string[]> {
    const query: Record<string, string | string[]> = {}

    for (const filter of normalizedFilters.value) {
      const value = filterValues.value[filter.queryParamName]

      if (Array.isArray(value)) {
        if (value.length > 0) {
          query[filter.queryParamName] = value
        }

        continue
      }
      if (typeof value === 'string' && value.length > 0) {
        query[filter.queryParamName] = value
      }
    }

    const sort = primarySort.value

    if (sort?.queryParamSortBy) {
      const value = sortValues.value[sort.queryParamSortBy]

      if (typeof value === 'string' && value.length > 0) {
        query[sort.queryParamSortBy] = value
      }
    }

    if (sort?.queryParamSortOrder) {
      const value = sortValues.value[sort.queryParamSortOrder]

      if (typeof value === 'string' && value.length > 0) {
        query[sort.queryParamSortOrder] = normalizeSortOrderValue(value)
      }
    }

    if (page > 0) {
      query.page = String(page)
    }

    return query
  }

  function isMatchingView(node: CeElementNode): boolean {
    const nodeProps = getNodeProps(node)
    const nodeViewId = String(nodeProps.viewId || '')
    const nodeDisplayId = String(nodeProps.displayId || '')
    const nodeParentUuid = String(nodeProps.parentUuid || '')
    const hasViewProps = nodeViewId.length > 0 || nodeDisplayId.length > 0
    const hasViewElement = Boolean(node.element?.startsWith('drupal-view-'))

    if (!hasViewProps && !hasViewElement) return false

    if (props.viewId && nodeViewId !== props.viewId) return false
    if (props.displayId && nodeDisplayId !== props.displayId) return false
    if (props.parentUuid && nodeParentUuid !== props.parentUuid) return false

    return true
  }

  function findViewNode(input: unknown): CeElementNode | null {
    if (!input) return null

    if (Array.isArray(input)) {
      for (const item of input) {
        const found = findViewNode(item)

        if (found) return found
      }

      return null
    }

    if (typeof input !== 'object') return null
    const node = input as CeElementNode

    if (isMatchingView(node)) return node

    const childCandidates: unknown[] = []
    const slots = getNodeSlots(node)

    if (Object.keys(slots).length > 0) {
      childCandidates.push(...Object.values(slots))
    }

    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
      if (key === 'element' || key === 'props' || key === 'slots') continue
      childCandidates.push(value)
    }

    for (const child of childCandidates) {
      const found = findViewNode(child)

      if (found) return found
    }

    return null
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
      const params = buildSearchParams(query)
      const queryString = params.toString()
      const requestPath = `${route.path}${queryString ? `?${queryString}` : ''}`

      const api = $ceApi()
      const pageResponse = await api(requestPath, {
        signal: activeAbortController.signal,
      })
      const responseRecord =
        pageResponse && typeof pageResponse === 'object'
          ? (pageResponse as Record<string, unknown>)
          : null
      const candidates = [
        pageResponse,
        responseRecord?.content,
        responseRecord?.items,
        responseRecord?.data,
      ]

      let viewNode: CeElementNode | null = null

      for (const candidate of candidates) {
        viewNode = findViewNode(candidate)
        if (viewNode) break
      }

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

      const viewNodeProps = getNodeProps(viewNode)

      dynamicRows.value = getNodeRows(viewNode)
      dynamicPager.value = (viewNodeProps.pager as ViewPager) ?? {
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

      const message = String(
        (error as { message?: string })?.message || error || '',
      )
      const isAbortError =
        (error instanceof DOMException && error.name === 'AbortError') ||
        message.includes('AbortError')

      if (isAbortError) return

      const isDrupalMemoryError =
        message.includes('Allowed memory size') ||
        message.includes('ApcuBackend.php')

      if (isDrupalMemoryError) {
        loadError.value =
          'Drupal ran out of memory while processing this view. Please try again or adjust backend memory/cache settings.'
      } else {
        loadError.value = 'Unable to load results. Please try again.'
      }

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
    scheduleRefresh(0)
  }

  function onSortChange(payload: { key: string; value: string }) {
    sortValues.value[payload.key] = payload.value
    currentPage.value = 0
    scheduleRefresh(0)
  }

  function onPageChange(value: number) {
    currentPage.value = value
    void refreshView(value)
  }

  function captureDefaultViewState() {
    if (defaultViewState.value) return

    const filtersSnapshot: Record<string, string | string[]> = {}

    for (const [key, value] of Object.entries(filterValues.value)) {
      filtersSnapshot[key] = Array.isArray(value) ? [...value] : value
    }

    const sortsSnapshot: Record<string, string | string[]> = {}

    for (const [key, value] of Object.entries(sortValues.value)) {
      sortsSnapshot[key] = Array.isArray(value) ? [...value] : value
    }

    defaultViewState.value = {
      filters: filtersSnapshot,
      sorts: sortsSnapshot,
    }
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
    scheduleRefresh(0)
  }

  onMounted(() => {
    captureDefaultViewState()
  })

  onBeforeUnmount(() => {
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
