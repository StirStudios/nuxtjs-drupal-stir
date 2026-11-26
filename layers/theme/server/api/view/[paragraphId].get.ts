import { defineEventHandler, getQuery } from 'h3'
import {
  createStirDrupalUpstreamError,
  forwardStirDrupalCacheHeaders,
  getStirForwardedCookie,
  stirDrupalApiFetch,
} from '../../../../foundation/server/utils/stirDrupalApi'
import { resolveDrupalCeConfig } from '../../../../foundation/shared/utils/drupalCeConfig'
import {
  buildParagraphViewPath,
  normalizeParagraphViewQuery,
  parseParagraphViewId,
} from '../../utils/paragraphViewApi'

export default defineEventHandler(async (event) => {
  const paragraphId = parseParagraphViewId(event.context.params?.paragraphId)
  const query = normalizeParagraphViewQuery(getQuery(event))
  const { ceApiEndpoint } = resolveDrupalCeConfig(useRuntimeConfig().public)

  try {
    const response = await stirDrupalApiFetch<Record<string, unknown>>(
      event,
      buildParagraphViewPath(ceApiEndpoint, paragraphId),
      { method: 'GET', query, forwardCookies: true },
    )

    if (!getStirForwardedCookie(event)) forwardStirDrupalCacheHeaders(event, response.headers)

    return response._data
  } catch (error) {
    throw createStirDrupalUpstreamError(error, 'Failed to refresh Drupal View.')
  }
})
