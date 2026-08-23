import { defineEventHandler } from 'h3'
import {
  assertDrupalResponseNotRedirect,
  captureDrupalApiError,
  getForwardedCookie,
  markPrivateResponse,
} from '../../../../../core/server/utils/drupalApi'
import { resolveDrupalCeApiConfig } from '../../../../../core/server/utils/drupalCeApiConfig'
import { buildDrupalHeaders } from '../../../../../core/server/utils/drupalHeaders'
import type { ParagraphPresentationResponse } from '#stir/types'
import {
  buildParagraphPresentationPath,
  createUpstreamParagraphPresentationError,
} from '../../../utils/paragraphPresentationApi'
import { parseParagraphId } from '../../../utils/paragraphTextApi'

export default defineEventHandler(async (event) => {
  const paragraphId = parseParagraphId(event.context.params?.paragraphId)
  const { apiKey, ceApiEndpoint, requestTimeoutMs }
    = resolveDrupalCeApiConfig(useRuntimeConfig())
  const cookie = getForwardedCookie(event)

  if (cookie) markPrivateResponse(event)

  try {
    const response = await $fetch.raw<ParagraphPresentationResponse>(
      buildParagraphPresentationPath(ceApiEndpoint, paragraphId),
      {
        headers: buildDrupalHeaders({ cookie, apiKey }),
        redirect: 'manual',
        timeout: requestTimeoutMs,
      },
    )

    assertDrupalResponseNotRedirect(response)
    return response._data
  }
  catch (error) {
    captureDrupalApiError(event, error)
    throw createUpstreamParagraphPresentationError(error)
  }
})
