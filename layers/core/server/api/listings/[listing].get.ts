import {
  createError,
  defineEventHandler,
  getQuery,
  setResponseHeader,
} from 'h3'
import {
  appendDrupalSetCookies,
  assertDrupalResponseNotRedirect,
  captureDrupalApiError,
  getDrupalApiConfig,
  getForwardedCookie,
  markPrivateResponse,
} from '../../utils/drupalApi'
import { buildDrupalHeaders } from '../../utils/drupalHeaders'
import {
  isPrivateStirListingResponse,
  parseStirListingId,
  parseStirListingResponse,
} from '../../utils/listingApi'
import {
  filterStirDrupalSetCookies,
  getStirDrupalSetCookies,
} from '../../utils/stirDrupalApi'

const FORWARDED_CACHE_HEADERS = ['cache-control', 'etag', 'last-modified'] as const

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

  const { apiKey, baseUrl, requestTimeoutMs } = getDrupalApiConfig()
  const cookie = getForwardedCookie(event)

  if (cookie) markPrivateResponse(event)

  try {
    const response = await $fetch.raw<unknown>(
      `${baseUrl}/api/stir/listings/${encodeURIComponent(listing)}`,
      {
        method: 'GET',
        query: getQuery(event),
        headers: buildDrupalHeaders({ apiKey, cookie }),
        redirect: 'manual',
        timeout: requestTimeoutMs,
      },
    )

    assertDrupalResponseNotRedirect(response)
    const payload = parseStirListingResponse(response._data)
    const setsSession = filterStirDrupalSetCookies(
      getStirDrupalSetCookies(response.headers),
    ).length > 0

    appendDrupalSetCookies(event, response)

    if (isPrivateStirListingResponse({
      hasRequestCookie: Boolean(cookie),
      setsSessionCookie: setsSession,
      personalized: payload.meta.personalized,
    })) {
      markPrivateResponse(event)
    } else {
      for (const header of FORWARDED_CACHE_HEADERS) {
        const value = response.headers.get(header)

        if (value) setResponseHeader(event, header, value)
      }
    }

    setResponseHeader(event, 'X-Stir-Listing-Contract', '1')
    return payload
  } catch (error) {
    captureDrupalApiError(event, error)
    const upstreamStatus = Number(
      (error as { statusCode?: unknown; status?: unknown })?.statusCode
      ?? (error as { status?: unknown }).status,
    )

    throw createError({
      statusCode: upstreamStatus >= 400 && upstreamStatus < 500
        ? upstreamStatus
        : 502,
      statusMessage: 'Failed to load Drupal listing.',
    })
  }
})
