import type { ViewPager } from '~/composables/useDrupalViewQuery'

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

export interface DrupalViewProps {
  title?: string
  gridItems?: string
  rowsWrapper?: string
  width?: string
  spacing?: string
  container?: boolean
  viewId?: string
  displayId?: string
  paragraphId?: number | string
  paragraphUuid?: string
  parentUuid?: string
  pager?: ViewPager | unknown
  randomize?: boolean | string
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
