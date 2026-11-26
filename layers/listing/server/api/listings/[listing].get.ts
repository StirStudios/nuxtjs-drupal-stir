import {
  createError,
  defineEventHandler,
  getQuery,
  setResponseHeader,
} from 'h3'
import {
  isPrivateStirListingResponse,
  parseStirListingId,
  parseStirListingResponse,
  toDrupalListingQuery,
} from '../../utils/listingApi'
import {
  appendStirDrupalSetCookies,
  createStirDrupalUpstreamError,
  filterStirDrupalSetCookies,
  forwardStirDrupalCacheHeaders,
  getStirDrupalSetCookies,
  getStirForwardedCookie,
  markStirPrivateResponse,
  stirDrupalApiFetch,
} from '../../../../foundation/server/utils/stirDrupalApi'

export default defineEventHandler(async (event) => {
  let listing: string

  try {
    listing = parseStirListingId(event.context.params?.listing)
  } catch {
    throw createError({
      statusCode: 404,
      statusMessage: 'Listing was not found.',
    })
  }

  try {
    const response = await stirDrupalApiFetch<unknown>(
      event,
      `/api/stir/listings/${encodeURIComponent(listing)}`,
      { method: 'GET', query: toDrupalListingQuery(getQuery(event)), forwardCookies: true },
    )
    const payload = parseStirListingResponse(response._data)
    const setsSession = filterStirDrupalSetCookies(
      getStirDrupalSetCookies(response.headers),
    ).length > 0

    appendStirDrupalSetCookies(event, response)

    if (isPrivateStirListingResponse({
      hasRequestCookie: Boolean(getStirForwardedCookie(event)),
      setsSessionCookie: setsSession,
      personalized: payload.meta.personalized,
    })) {
      markStirPrivateResponse(event)
    } else {
      forwardStirDrupalCacheHeaders(event, response.headers)
    }

    setResponseHeader(event, 'X-Stir-Listing-Contract', '1')
    return payload
  } catch (error) {
    // Upstream and contract failures are operational state, not cacheable
    // listing representations. Never let a CDN retain them as public output.
    markStirPrivateResponse(event)
    throw createStirDrupalUpstreamError(error, 'Failed to load Drupal listing.')
  }
})
