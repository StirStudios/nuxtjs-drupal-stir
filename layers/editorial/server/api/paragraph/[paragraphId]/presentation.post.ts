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
  ParagraphLayoutUpdate,
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
  const body = await readBody<{ layout?: unknown, values?: unknown }>(event)

  const hasValues = body?.values !== undefined
  const hasLayout = body?.layout !== undefined

  if ((!hasValues && !hasLayout)
    || (hasValues && (typeof body.values !== 'object' || body.values === null || Array.isArray(body.values)))
    || (hasLayout && (typeof body.layout !== 'object' || body.layout === null || Array.isArray(body.layout)))) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Presentation values or a layout change are required.',
    })
  }

  const values = (body.values ?? {}) as PresentationValues
  const layout = body.layout as ParagraphLayoutUpdate | undefined
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
        body: { values, ...(layout ? { layout } : {}) },
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
