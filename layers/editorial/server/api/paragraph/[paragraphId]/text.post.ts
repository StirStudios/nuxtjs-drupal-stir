import { createError, defineEventHandler, readBody } from 'h3'
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

interface ParagraphTextPayload {
  text?: unknown
}

export default defineEventHandler(async (event) => {
  assertStirSameOrigin(event)

  const paragraphId = parseParagraphId(event.context.params?.paragraphId)

  const body = await readBody<ParagraphTextPayload>(event)
  const text = typeof body?.text === 'string' ? body.text.trim() : ''

  if (!text) {
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
  const savePath = buildParagraphTextPath(ceApiEndpoint, paragraphId)
  const cookie = getForwardedCookie(event)

  if (cookie) markPrivateResponse(event)

  try {
    const csrfResponse = await $fetch.raw<string>(`${drupalBaseUrl}/session/token`, {
      headers: buildDrupalHeaders({
        cookie,
        apiKey,
      }),
      redirect: 'manual',
      timeout: requestTimeoutMs,
    })

    assertDrupalResponseNotRedirect(csrfResponse)

    const csrfToken = csrfResponse._data

    const saveResponse = await $fetch.raw<{ ok: boolean; message?: string }>(savePath, {
      method: 'POST',
      body: { text },
      headers: buildDrupalHeaders({
        apiKey,
        cookie,
        csrfToken: csrfToken ? String(csrfToken) : undefined,
      }),
      redirect: 'manual',
      timeout: requestTimeoutMs,
    })

    assertDrupalResponseNotRedirect(saveResponse)

    return saveResponse._data
  } catch (error) {
    captureDrupalApiError(event, error)

    throw createUpstreamParagraphTextError(error, 'Failed to save paragraph text.')
  }
})
