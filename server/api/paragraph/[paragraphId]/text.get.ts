import { defineEventHandler, getHeader } from 'h3'
import {
  buildParagraphTextPath,
  createUpstreamParagraphTextError,
  parseParagraphId,
  resolveParagraphTextApiConfig,
} from '~/server/utils/paragraphTextApi'

export default defineEventHandler(async (event) => {
  const paragraphId = parseParagraphId(event.context.params?.paragraphId)

  const config = useRuntimeConfig()
  const {
    apiKey,
    ceApiEndpoint,
  } = resolveParagraphTextApiConfig(config)
  const readPath = buildParagraphTextPath(ceApiEndpoint, paragraphId)
  const cookie = getHeader(event, 'cookie')

  try {
    return await $fetch<{ ok: boolean; text?: string; format?: string; message?: string }>(readPath, {
      method: 'GET',
      headers: {
        ...(cookie ? { cookie: String(cookie) } : {}),
        ...(apiKey ? { 'x-api-key': apiKey } : {}),
      },
    })
  } catch (error) {
    throw createUpstreamParagraphTextError(error, 'Failed to read paragraph text.')
  }
})
