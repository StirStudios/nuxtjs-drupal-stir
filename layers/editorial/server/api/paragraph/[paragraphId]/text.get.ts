import { defineEventHandler } from 'h3'
import {
  assertDrupalResponseNotRedirect,
  captureDrupalApiError,
  getForwardedCookie,
  markPrivateResponse,
} from '../../../../../core/server/utils/drupalApi'
import { resolveDrupalCeApiConfig } from '../../../../../core/server/utils/drupalCeApiConfig'
import { buildDrupalHeaders } from '../../../../../core/server/utils/drupalHeaders'
import {
  buildParagraphTextPath,
  createUpstreamParagraphTextError,
  parseParagraphId,
} from '../../../utils/paragraphTextApi'

export default defineEventHandler(async (event) => {
  const paragraphId = parseParagraphId(event.context.params?.paragraphId)

  const config = useRuntimeConfig()
  const {
    apiKey,
    ceApiEndpoint,
    requestTimeoutMs,
  } = resolveDrupalCeApiConfig(config)
  const readPath = buildParagraphTextPath(ceApiEndpoint, paragraphId)
  const cookie = getForwardedCookie(event)

  if (cookie) markPrivateResponse(event)

  try {
    const response = await $fetch.raw<{
      ok: boolean
      text?: string
      format?: string
      message?: string
    }>(readPath, {
      method: 'GET',
      headers: buildDrupalHeaders({
        cookie,
        apiKey,
      }),
      redirect: 'manual',
      timeout: requestTimeoutMs,
    })

    assertDrupalResponseNotRedirect(response)

    return response._data
  } catch (error) {
    captureDrupalApiError(event, error)

    throw createUpstreamParagraphTextError(error, 'Failed to read paragraph text.')
  }
})
