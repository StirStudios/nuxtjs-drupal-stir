import { defineEventHandler } from 'h3'
import {
  assertDrupalResponseNotRedirect,
  captureDrupalApiError,
  getForwardedCookie,
  markPrivateResponse,
} from '../../../../../../core/server/utils/drupalApi'
import { resolveDrupalCeApiConfig } from '../../../../../../core/server/utils/drupalCeApiConfig'
import { buildDrupalHeaders } from '../../../../../../core/server/utils/drupalHeaders'
import { createUpstreamParagraphTextError } from '../../../../utils/paragraphTextApi'
import {
  buildFormattedTextPath,
  parseFormattedTextRouteTarget,
} from '../../../../utils/formattedTextApi'

export default defineEventHandler(async (event) => {
  const target = parseFormattedTextRouteTarget(event.context.params)
  const config = useRuntimeConfig()
  const {
    apiKey,
    ceApiEndpoint,
    requestTimeoutMs,
  } = resolveDrupalCeApiConfig(config)
  const readPath = buildFormattedTextPath(ceApiEndpoint, target)
  const cookie = getForwardedCookie(event)

  if (cookie) markPrivateResponse(event)

  try {
    const response = await $fetch.raw<{
      ok: boolean
      text?: string
      format?: string
      required?: boolean
      message?: string
    }>(readPath, {
      method: 'GET',
      headers: buildDrupalHeaders({ cookie, apiKey }),
      redirect: 'manual',
      timeout: requestTimeoutMs,
    })

    assertDrupalResponseNotRedirect(response)

    return response._data
  }
  catch (error) {
    captureDrupalApiError(event, error)

    throw createUpstreamParagraphTextError(
      error,
      'Failed to read formatted text.',
    )
  }
})
