import {
  isValidDrupalViewFilterValue,
  isValidDrupalViewSortByValue,
  isValidDrupalViewSortOrderValue,
  type NormalizedViewFilter,
} from '../composables/useDrupalViewQuery'
import type { ExposedFilter, ExposedSort } from '../types/View'

export type ViewControlValue = string | string[]

export interface ViewStateSnapshot {
  filters: Record<string, ViewControlValue>
  sorts: Record<string, ViewControlValue>
  page?: number
  savedAt?: number
}

export interface ViewStateStorageIdentity {
  path: string
  viewId?: string
  displayId?: string
  parentUuid?: string
}

export const VIEW_STATE_MAX_AGE_MS = 30 * 60 * 1000

export function cloneViewControlValues(
  values: Record<string, ViewControlValue>,
): Record<string, ViewControlValue> {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [
      key,
      Array.isArray(value) ? [...value] : value,
    ]),
  )
}

export function createViewStateSnapshot(
  filters: Record<string, ViewControlValue>,
  sorts: Record<string, ViewControlValue>,
  page: number,
  savedAt = Date.now(),
): ViewStateSnapshot {
  return {
    filters: cloneViewControlValues(filters),
    sorts: cloneViewControlValues(sorts),
    page,
    savedAt,
  }
}

export function createViewStateStorageKey(
  identity: ViewStateStorageIdentity,
): string {
  return [
    'stir:view-controls',
    identity.path,
    identity.viewId || '',
    identity.displayId || '',
    identity.parentUuid || '',
  ].join(':')
}

export function parseStoredViewState(
  value: string | null,
  now = Date.now(),
  maxAgeMs = VIEW_STATE_MAX_AGE_MS,
): ViewStateSnapshot | null {
  if (!value) return null

  try {
    const parsed = JSON.parse(value) as Partial<ViewStateSnapshot>
    const savedAt = typeof parsed.savedAt === 'number' ? parsed.savedAt : 0

    if (
      !parsed.filters || typeof parsed.filters !== 'object' ||
      !parsed.sorts || typeof parsed.sorts !== 'object' ||
      now - savedAt > maxAgeMs
    ) {
      return null
    }

    return parsed as ViewStateSnapshot
  } catch {
    return null
  }
}

export function firstViewControlString(value: ViewControlValue | undefined): string {
  return Array.isArray(value) ? String(value[0] ?? '') : String(value ?? '')
}

export function defaultDrupalViewFilterValue(
  filter: Pick<NormalizedViewFilter, 'multiple'>,
  source?: ExposedFilter,
): ViewControlValue {
  const submitted = source?.submittedValues ?? []

  return filter.multiple
    ? submitted.map(value => String(value))
    : String(submitted[0] ?? '')
}

export function createDefaultDrupalViewState(options: {
  filters: NormalizedViewFilter[]
  exposedFilters: ExposedFilter[]
  sort: ExposedSort | null
  savedAt?: number
}): ViewStateSnapshot {
  const filters: Record<string, ViewControlValue> = {}

  for (const filter of options.filters) {
    const source = options.exposedFilters.find(
      item => item.queryParamName === filter.queryParamName,
    )

    filters[filter.queryParamName] = defaultDrupalViewFilterValue(filter, source)
  }

  const sorts: Record<string, ViewControlValue> = {}

  if (options.sort?.queryParamSortBy) {
    sorts[options.sort.queryParamSortBy] = options.sort.sortByValue || ''
  }

  if (options.sort?.queryParamSortOrder) {
    sorts[options.sort.queryParamSortOrder] = options.sort.submittedOrder || ''
  }

  return { filters, sorts, page: 0, savedAt: options.savedAt ?? Date.now() }
}

export function sanitizeDrupalViewStoredFilters(options: {
  filters?: ViewStateSnapshot['filters']
  definitions: NormalizedViewFilter[]
  exposedFilters: ExposedFilter[]
}): ViewStateSnapshot['filters'] | null {
  const sanitized: ViewStateSnapshot['filters'] = {}

  for (const filter of options.definitions) {
    const source = options.exposedFilters.find(
      item => item.queryParamName === filter.queryParamName,
    )
    const fallback = defaultDrupalViewFilterValue(filter, source)
    const value = Object.prototype.hasOwnProperty.call(
      options.filters ?? {},
      filter.queryParamName,
    )
      ? options.filters?.[filter.queryParamName] ?? fallback
      : fallback

    if (!isValidDrupalViewFilterValue(filter, value)) return null

    sanitized[filter.queryParamName] = value
  }

  return sanitized
}

export function sanitizeDrupalViewStoredSorts(options: {
  sorts?: ViewStateSnapshot['sorts']
  sort: ExposedSort | null
  sortByOptions: Array<{ value: string }>
  sortOrderOptions: Array<{ value: string }>
}): ViewStateSnapshot['sorts'] | null {
  const sort = options.sort

  if (!sort) return {}

  const sanitized: ViewStateSnapshot['sorts'] = {}

  if (sort.queryParamSortBy) {
    const value = Object.prototype.hasOwnProperty.call(
      options.sorts ?? {},
      sort.queryParamSortBy,
    )
      ? firstViewControlString(options.sorts?.[sort.queryParamSortBy])
      : sort.sortByValue || ''

    if (!isValidDrupalViewSortByValue(value, options.sortByOptions)) return null

    sanitized[sort.queryParamSortBy] = value
  }

  if (sort.queryParamSortOrder) {
    const value = Object.prototype.hasOwnProperty.call(
      options.sorts ?? {},
      sort.queryParamSortOrder,
    )
      ? firstViewControlString(options.sorts?.[sort.queryParamSortOrder])
      : sort.submittedOrder || ''

    if (!isValidDrupalViewSortOrderValue(sort, value, options.sortOrderOptions)) {
      return null
    }

    sanitized[sort.queryParamSortOrder] = value
  }

  return sanitized
}
