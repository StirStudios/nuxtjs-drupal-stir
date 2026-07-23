import { createError, defineEventHandler, readBody } from 'h3'
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

interface FormattedTextPayload {
  text?: unknown
}

export default defineEventHandler(async (event) => {
  assertStirSameOrigin(event)

  const target = parseFormattedTextRouteTarget(event.context.params)
  const body = await readBody<FormattedTextPayload>(event)

  if (typeof body?.text !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Text is required.',
    })
  }

  const config = useRuntimeConfig()
  const {
    apiKey,
    ceApiEndpoint,
    drupalBaseUrl,
    requestTimeoutMs,
  } = resolveDrupalCeApiConfig(config)
  const savePath = buildFormattedTextPath(ceApiEndpoint, target)
  const cookie = getForwardedCookie(event)

  if (cookie) markPrivateResponse(event)

  try {
    const csrfResponse = await $fetch.raw<string>(
      `${drupalBaseUrl}/session/token`,
      {
        headers: buildDrupalHeaders({ cookie, apiKey }),
        redirect: 'manual',
        timeout: requestTimeoutMs,
      },
    )

    assertDrupalResponseNotRedirect(csrfResponse)

    const saveResponse = await $fetch.raw<{
      ok: boolean
      message?: string
    }>(savePath, {
      method: 'POST',
      body: { text: body.text.trim() },
      headers: buildDrupalHeaders({
        apiKey,
        cookie,
        csrfToken: csrfResponse._data
          ? String(csrfResponse._data)
          : undefined,
      }),
      redirect: 'manual',
      timeout: requestTimeoutMs,
    })

    assertDrupalResponseNotRedirect(saveResponse)

    return saveResponse._data
  }
  catch (error) {
    captureDrupalApiError(event, error)

    throw createUpstreamParagraphTextError(
      error,
      'Failed to save formatted text.',
    )
  }
})
