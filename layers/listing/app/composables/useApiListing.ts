export type ApiListingFilterOption = {
  value: number | string
  label: string
}

export type ApiListingFilters = Record<string, ApiListingFilterOption[] | undefined>

export type ApiListingPager = {
  current: number
  itemsPerPage: number
  totalItems: number
  totalPages: number
}

export type ApiListingResponse<TItem = unknown, TFilters extends ApiListingFilters = ApiListingFilters> = {
  items?: TItem[]
  pager?: ApiListingPager
  filters?: TFilters
  activeFilters?: Record<string, unknown>
}

export type ApiListingQueryValue = string | number | boolean | Array<string | number | boolean> | null | undefined
export type ApiListingQuery = Record<string, ApiListingQueryValue>

export function normalizeApiListingQuery(query: ApiListingQuery = {}) {
  return Object.fromEntries(
    Object.entries(query).filter(([, value]) => {
      if (Array.isArray(value)) return value.length > 0
      return value !== undefined && value !== null && value !== ''
    }),
  )
}

export function useApiListing<TItem = unknown, TFilters extends ApiListingFilters = ApiListingFilters>(endpoint: string) {
  const requestFetch = useRequestFetch()

  const list = (query: ApiListingQuery = {}) => {
    return requestFetch<ApiListingResponse<TItem, TFilters>>(endpoint, {
      query: normalizeApiListingQuery(query),
    })
  }

  return {
    list,
    normalizeQuery: normalizeApiListingQuery,
  }
}
