import type { ExposedFilter, ExposedSort } from '#stir/types/View'

export interface ViewPager {
  current: number
  totalPages: number
}

export interface NormalizedViewFilter {
  label: string
  queryParamName: string
  multiple?: boolean
  disabled?: boolean
  options: Array<{ label: string, value: string }>
}

interface RawViewPager {
  current?: unknown
  totalPages?: unknown
  total_pages?: unknown
}

interface DrupalViewFilterValueValidator {
  options: Array<{ label: string, value: string }>
}

export function mapDrupalViewFilterOptions(
  options: Record<string, string> | string[] | undefined,
): Array<{ label: string, value: string }> {
  if (!options) return []

  if (Array.isArray(options)) {
    return options.map((label, index) => ({
      label,
      value: String(index),
    }))
  }

  return Object.entries(options).map(([value, label]) => ({ label, value }))
}

export function normalizeDrupalViewFilters(
  filters: readonly unknown[],
): NormalizedViewFilter[] {
  return filters
    .filter((filter): filter is ExposedFilter => {
      if (!filter || typeof filter !== 'object') return false

      const candidate = filter as ExposedFilter

      return Boolean(candidate.queryParamName && candidate.label && candidate.options)
    })
    .map(filter => ({
      label: filter.label,
      queryParamName: filter.queryParamName,
      multiple: filter.multiple,
      disabled: filter.disabled,
      options: mapDrupalViewFilterOptions(filter.options),
    }))
}

export function primaryDrupalViewSort(
  sorts: readonly unknown[],
): ExposedSort | null {
  const [sort] = sorts as ExposedSort[]

  return sort?.queryParamSortBy && sort.queryParamSortOrder ? sort : null
}

export function mapDrupalViewSortByOptions(sort: ExposedSort | null) {
  if (!sort?.sortByValue) return []

  return [{ label: sort.label || sort.sortByValue, value: sort.sortByValue }]
}

export function mapDrupalViewSortOrderOptions(sort: ExposedSort | null) {
  return Object.entries(sort?.sortOrderOptions ?? {}).map(
    ([value, label]) => ({ label, value }),
  )
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

export function isSafeDrupalViewControlValue(value: string): boolean {
  return !/[?&][\w%.-]+=/u.test(value)
}

export function isValidDrupalViewFilterValue(
  filter: DrupalViewFilterValueValidator,
  value: string | string[],
): boolean {
  const values = Array.isArray(value) ? value : [value]
  const allowed = new Set(filter.options.map(option => option.value))

  return values.every(item => (
    isSafeDrupalViewControlValue(item) &&
    (allowed.size === 0 || allowed.has(item))
  ))
}

export function isValidDrupalViewSortByValue(
  value: string,
  options: Array<{ value: string }>,
): boolean {
  if (!value || !isSafeDrupalViewControlValue(value)) return false

  const allowed = new Set(options.map(option => option.value))

  return allowed.size === 0 || allowed.has(value)
}

export function isValidDrupalViewSortOrderValue(
  sort: ExposedSort,
  value: string,
  options: Array<{ value: string }>,
): boolean {
  if (!value || !isSafeDrupalViewControlValue(value)) return false

  const allowed = new Set<string>()

  for (const option of options) {
    allowed.add(option.value)
    allowed.add(normalizeDrupalViewSortOrderValue(option.value))
  }

  if (sort.submittedOrder) {
    allowed.add(sort.submittedOrder)
    allowed.add(normalizeDrupalViewSortOrderValue(sort.submittedOrder))
  }

  return allowed.has(value)
}

export function drupalViewManagedQueryKeys(
  filters: NormalizedViewFilter[],
  sort: ExposedSort | null,
): string[] {
  const keys = ['page']

  for (const filter of filters) {
    keys.push(filter.queryParamName, `${filter.queryParamName}[]`)
  }

  if (sort?.queryParamSortBy) {
    keys.push(sort.queryParamSortBy, `${sort.queryParamSortBy}[]`)
  }

  if (sort?.queryParamSortOrder) {
    keys.push(sort.queryParamSortOrder, `${sort.queryParamSortOrder}[]`)
  }

  return keys
}

export function buildDrupalViewControlQuery(options: {
  filters: NormalizedViewFilter[]
  filterValues: Record<string, string | string[]>
  sort: ExposedSort | null
  sortValues: Record<string, string | string[]>
  sortByOptions: Array<{ value: string }>
  sortOrderOptions: Array<{ value: string }>
  page: number
}): Record<string, string | string[]> {
  const query: Record<string, string | string[]> = {}

  for (const filter of options.filters) {
    const value = options.filterValues[filter.queryParamName]

    if (Array.isArray(value)) {
      if (value.length && isValidDrupalViewFilterValue(filter, value)) {
        query[`${filter.queryParamName}[]`] = value
      }
    } else if (value && isValidDrupalViewFilterValue(filter, value)) {
      query[filter.queryParamName] = value
    }
  }

  const sort = options.sort

  if (sort?.queryParamSortBy) {
    const value = options.sortValues[sort.queryParamSortBy]

    if (
      typeof value === 'string'
      && isValidDrupalViewSortByValue(value, options.sortByOptions)
    ) {
      query[sort.queryParamSortBy] = value
    }
  }

  if (sort?.queryParamSortOrder) {
    const value = options.sortValues[sort.queryParamSortOrder]

    if (
      typeof value === 'string'
      && isValidDrupalViewSortOrderValue(sort, value, options.sortOrderOptions)
    ) {
      query[sort.queryParamSortOrder] = normalizeDrupalViewSortOrderValue(value)
    }
  }

  if (options.page > 0) query.page = String(options.page)

  return query
}
