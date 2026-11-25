import { defineEventHandler, readBody } from 'h3'
import { stirDrupalApiRequest } from '../../../../../foundation/server/utils/stirDrupalApi'
import { resolveDrupalCeConfig } from '../../../../../foundation/shared/utils/drupalCeConfig'
import {
  buildParagraphTextPath,
  createUpstreamParagraphTextError,
  parseParagraphId,
  parseTextValue,
} from '../../../utils/paragraphTextApi'

interface ParagraphTextPayload {
  text?: unknown
}

export default defineEventHandler(async (event) => {
  assertStirSameOrigin(event)

  const paragraphId = parseParagraphId(event.context.params?.paragraphId)
  const body = await readBody<ParagraphTextPayload>(event)
  const text = parseTextValue(body?.text)
  const { ceApiEndpoint } = resolveDrupalCeConfig(useRuntimeConfig().public)

  try {
    return await stirDrupalApiRequest<{ ok: boolean, message?: string }>(
      event,
      buildParagraphTextPath(ceApiEndpoint, paragraphId),
      {
        method: 'POST',
        body: { text },
        enforceSameOrigin: false,
        forwardCookies: true,
      },
    )
  }
  catch (error) {
    throw createUpstreamParagraphTextError(error, 'Failed to save paragraph text.')
  }
})
