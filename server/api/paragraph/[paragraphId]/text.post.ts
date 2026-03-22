import { createError, defineEventHandler, getHeader, readBody } from 'h3'
import {
  buildParagraphTextPath,
  createUpstreamParagraphTextError,
  parseParagraphId,
  resolveParagraphTextApiConfig,
} from '~/server/utils/paragraphTextApi'

interface ParagraphTextPayload {
  text?: unknown
}

export default defineEventHandler(async (event) => {
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
  } = resolveParagraphTextApiConfig(config)
  const savePath = buildParagraphTextPath(ceApiEndpoint, paragraphId)
  const cookie = getHeader(event, 'cookie')

  try {
    const csrfToken = await $fetch<string>(`${drupalBaseUrl}/session/token`, {
      headers: {
        ...(cookie ? { cookie: String(cookie) } : {}),
        ...(apiKey ? { 'x-api-key': apiKey } : {}),
      },
    })

    return await $fetch<{ ok: boolean; message?: string }>(savePath, {
      method: 'POST',
      body: { text },
      headers: {
        ...(cookie ? { cookie: String(cookie) } : {}),
        ...(csrfToken ? { 'x-csrf-token': String(csrfToken) } : {}),
      },
    })
  } catch (error) {
    throw createUpstreamParagraphTextError(error, 'Failed to save paragraph text.')
  }
})
