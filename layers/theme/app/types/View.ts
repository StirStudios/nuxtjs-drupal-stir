import type { ExposedFilter, ExposedSort, ViewPager } from '~/composables/useDrupalViewControls'

export interface DrupalViewProps {
  title?: string
  gridItems?: string
  rowsWrapper?: string
  width?: string
  spacing?: string
  container?: boolean
  viewId?: string
  displayId?: string
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
