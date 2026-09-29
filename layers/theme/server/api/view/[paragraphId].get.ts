import {
  defineEventHandler,
  getQuery,
  setResponseHeader,
} from 'h3'
import {
  assertStirDrupalResponseNotRedirect,
  buildStirDrupalHeaders,
  captureStirDrupalApiError,
  createStirDrupalUpstreamError,
  getStirForwardedCookie,
  markStirPrivateResponse,
} from '../../../../foundation/server/utils/stirDrupalApi'
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
  const {
    apiKey,
    ceApiEndpoint,
    drupalBaseUrl,
    requestTimeoutMs,
  } = resolveDrupalCeApiConfig(useRuntimeConfig())
  const requestPath = buildParagraphViewPath(ceApiEndpoint, paragraphId)
  const cookie = getStirForwardedCookie(event)

  if (cookie) markStirPrivateResponse(event)

  try {
    const response = await $fetch.raw<Record<string, unknown>>(
      `${drupalBaseUrl}${requestPath}`,
      {
        method: 'GET',
        query,
        headers: buildStirDrupalHeaders({ cookie, apiKey }),
        redirect: 'manual',
        timeout: requestTimeoutMs,
      },
    )

    assertStirDrupalResponseNotRedirect(response)

    if (!cookie) {
      for (const header of FORWARDED_CACHE_HEADERS) {
        const value = response.headers.get(header)

        if (value) setResponseHeader(event, header, value)
      }
    }

    return response._data
  } catch (error) {
    captureStirDrupalApiError(event, error)
    throw createStirDrupalUpstreamError(error, 'Failed to refresh Drupal View.')
  }
})
