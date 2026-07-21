import {
  createError,
  defineEventHandler,
  getQuery,
  setResponseHeader,
} from 'h3'
import {
  assertDrupalResponseNotRedirect,
  captureDrupalApiError,
  getForwardedCookie,
  markPrivateResponse,
} from '../../../../core/server/utils/drupalApi'
import { buildDrupalHeaders } from '../../../../core/server/utils/drupalHeaders'
import { resolveDrupalCeApiConfig } from '../../../../core/server/utils/drupalCeApiConfig'
import {
  buildParagraphViewPath,
  normalizeParagraphViewQuery,
  parseParagraphViewId,
} from '../../utils/paragraphViewApi'

const FORWARDED_CACHE_HEADERS = ['cache-control', 'etag', 'last-modified'] as const

export default defineEventHandler(async (event) => {
  const paragraphId = parseParagraphViewId(event.context.params?.paragraphId)
  const query = normalizeParagraphViewQuery(getQuery(event))
  const config = useRuntimeConfig()
  const {
    apiKey,
    ceApiEndpoint,
    requestTimeoutMs,
  } = resolveDrupalCeApiConfig(config)
  const requestPath = buildParagraphViewPath(ceApiEndpoint, paragraphId)
  const cookie = getForwardedCookie(event)

  if (cookie) markPrivateResponse(event)

  try {
    const response = await $fetch.raw<Record<string, unknown>>(requestPath, {
      method: 'GET',
      query,
      headers: buildDrupalHeaders({ cookie, apiKey }),
      redirect: 'manual',
      timeout: requestTimeoutMs,
    })

    assertDrupalResponseNotRedirect(response)

    if (!cookie) {
      for (const header of FORWARDED_CACHE_HEADERS) {
        const value = response.headers.get(header)

        if (value) setResponseHeader(event, header, value)
      }
    }

    return response._data
  } catch (error) {
    captureDrupalApiError(event, error)

    const upstreamStatus = Number(
      (error as { statusCode?: unknown; status?: unknown })?.statusCode
      ?? (error as { status?: unknown })?.status,
    )

    throw createError({
      statusCode: upstreamStatus >= 400 && upstreamStatus < 500
        ? upstreamStatus
        : 502,
      statusMessage: 'Failed to refresh Drupal View.',
    })
  }
})
