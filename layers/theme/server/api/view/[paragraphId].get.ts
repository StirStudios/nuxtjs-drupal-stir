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
  getStirDrupalApiConfig,
  getStirForwardedCookie,
  markStirPrivateResponse,
  stirDrupalTimeoutOptions,
} from '../../../../foundation/server/utils/stirDrupalApi'
import { recordStirCacheTags } from '../../../../foundation/server/utils/stirCacheTags'
import { resolveDrupalCeConfig } from '../../../../foundation/shared/utils/drupalCeConfig'
import {
  buildParagraphViewPath,
  normalizeParagraphViewQuery,
  parseParagraphViewId,
} from '../../utils/paragraphViewApi'

const FORWARDED_CACHE_HEADERS = ['cache-control', 'etag', 'last-modified'] as const

export default defineEventHandler(async (event) => {
  const paragraphId = parseParagraphViewId(event.context.params?.paragraphId)
  const query = normalizeParagraphViewQuery(getQuery(event))
  const { apiKey, baseUrl: drupalBaseUrl, requestTimeoutMs } = getStirDrupalApiConfig()
  const { ceApiEndpoint } = resolveDrupalCeConfig(useRuntimeConfig().public)
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
        ...stirDrupalTimeoutOptions(requestTimeoutMs),
      },
    )

    assertStirDrupalResponseNotRedirect(response)
    recordStirCacheTags(event, response.headers)

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
