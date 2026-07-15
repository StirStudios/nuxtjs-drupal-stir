export interface ListingPager {
  page: number
  pageSize: number
  total: number | null
  totalPages: number | null
  hasNext: boolean
}

export interface ListingFilterOption {
  value: string | number
  label: string
  [key: string]: unknown
}

export interface ListingResponse<TItem extends Record<string, unknown> = Record<string, unknown>> {
  schemaVersion: 1
  listing: string
  items: TItem[]
  pager: ListingPager
  filters: {
    active: Record<string, string[]>
    options: Record<string, ListingFilterOption[]>
  }
  sort: {
    by: string
    order: 'asc' | 'desc'
  }
  meta: {
    provider: string
    summaryEntityType: string
    summaryViewMode: string
    personalized: boolean
  }
}
