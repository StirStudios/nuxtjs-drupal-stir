import type { StirListingResponse } from '../../shared/types/listing'
import {
  normalizeApiListingQuery,
  type ApiListingQuery,
} from './useApiListing'

/**
 * Fetches the vNext provider-neutral listing contract through Nuxt's server.
 */
export function useStirListing<
  TItem extends Record<string, unknown> = Record<string, unknown>,
>(listing: string) {
  const requestFetch = useRequestFetch()
  const endpoint = `/api/listings/${encodeURIComponent(listing)}`

  const list = (query: ApiListingQuery = {}) =>
    requestFetch<StirListingResponse<TItem>>(endpoint, {
      query: normalizeApiListingQuery(query),
    })

  return {
    list,
    normalizeQuery: normalizeApiListingQuery,
  }
}
