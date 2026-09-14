import type { NormalizedViewFilter, ViewPager } from '#stir/composables/useDrupalViewQuery'
import type { GridConfig } from '#stir/utils/gridClasses'

export interface ExposedFilter {
  label: string
  queryParamName: string
  type?: string
  multiple?: boolean
  disabled?: boolean
  options?: Record<string, string> | string[]
  submittedValues?: unknown[]
}

export interface ExposedSort {
  defaultSortBy?: string
  defaultOrder?: string
  label?: string
  sortByValue?: string
  submittedOrder?: string
  queryParamSortBy?: string
  queryParamSortOrder?: string
  sortOrderOptions?: Record<string, string>
}

export interface DrupalRandomOrder {
  key: string
  value: string
}

export interface DrupalViewProps {
  randomOrder?: DrupalRandomOrder

  title?: string
  gridItems?: GridConfig
  rowsWrapper?: string
  width?: string
  spacing?: string
  container?: boolean
  viewId?: string
  displayId?: string
  paragraphId?: number | string
  paragraphUuid?: string
  parentUuid?: string
  queryNamespace?: string
  pager?: ViewPager | unknown
  carousel?: boolean
  carouselArrows?: boolean
  carouselAutoheight?: boolean
  carouselAutoscroll?: boolean
  carouselFade?: boolean
  carouselIndicators?: boolean
  carouselInterval?: number
  direction?: string
  args?: unknown
  exposedFilters?: ExposedFilter[] | unknown[]
  exposedSorts?: ExposedSort[] | unknown[]
  restoreScrollLinkPattern?: string
  noResults?: string
}

export interface DrupalViewActiveFilter {
  key: string
  filterKey: string
  filterLabel: string
  label: string
  value: string
  removeLabel: string
}

export interface DrupalViewControlsSlotProps {
  filters: NormalizedViewFilter[]
  filterValues: Record<string, string | string[]>
  sort: ExposedSort | null
  sortByOptions: Array<{ label: string, value: string }>
  sortOrderOptions: Array<{ label: string, value: string }>
  sortValues: Record<string, string | string[]>
  activeFilters: DrupalViewActiveFilter[]
  isLoading: boolean
  setFilter: (payload: { key: string, value: string | string[] }) => void
  setSort: (payload: { key: string, value: string }) => void
  removeFilter: (filter: Pick<DrupalViewActiveFilter, 'filterKey' | 'value'>) => void
  resetFilters: () => void
  resetSort: () => void
  resetControls: () => void
}
