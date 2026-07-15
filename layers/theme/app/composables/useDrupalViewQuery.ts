import type { ExposedFilter, ExposedSort } from '~/types/View'

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
