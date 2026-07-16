export interface StirListingPager {
  page: number
  pageSize: number
  total: number | null
  totalPages: number | null
  hasNext: boolean
}

export interface StirListingFilterOption {
  value: string | number
  label: string
  [key: string]: unknown
}

export interface StirListingResponse<
  TItem extends Record<string, unknown> = Record<string, unknown>,
> {
  schemaVersion: 1
  listing: string
  items: TItem[]
  pager: StirListingPager
  filters: {
    active: Record<string, string[]>
    options: Record<string, StirListingFilterOption[]>
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
