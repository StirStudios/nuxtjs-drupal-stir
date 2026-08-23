import { createError, defineEventHandler, readBody } from 'h3'
import {
  assertDrupalResponseNotRedirect,
  captureDrupalApiError,
  getForwardedCookie,
  markPrivateResponse,
} from '../../../../../core/server/utils/drupalApi'
import { resolveDrupalCeApiConfig } from '../../../../../core/server/utils/drupalCeApiConfig'
import { buildDrupalHeaders } from '../../../../../core/server/utils/drupalHeaders'
import type {
  ParagraphPresentationKey,
  ParagraphPresentationResponse,
} from '#stir/types'
import {
  buildParagraphPresentationPath,
  createUpstreamParagraphPresentationError,
} from '../../../utils/paragraphPresentationApi'
import { parseParagraphId } from '../../../utils/paragraphTextApi'

type PresentationValues = Partial<
  Record<ParagraphPresentationKey, boolean | string | string[]>
>

export default defineEventHandler(async (event) => {
  assertStirSameOrigin(event)

  const paragraphId = parseParagraphId(event.context.params?.paragraphId)
  const body = await readBody<{ values?: unknown }>(event)

  if (!body?.values || typeof body.values !== 'object' || Array.isArray(body.values)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Presentation values are required.',
    })
  }

  const values = body.values as PresentationValues
  const { apiKey, ceApiEndpoint, drupalBaseUrl, requestTimeoutMs }
    = resolveDrupalCeApiConfig(useRuntimeConfig())
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

    const response = await $fetch.raw<ParagraphPresentationResponse>(
      buildParagraphPresentationPath(ceApiEndpoint, paragraphId),
      {
        method: 'POST',
        body: { values },
        headers: buildDrupalHeaders({
          cookie,
          apiKey,
          csrfToken: csrfResponse._data
            ? String(csrfResponse._data)
            : undefined,
        }),
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
