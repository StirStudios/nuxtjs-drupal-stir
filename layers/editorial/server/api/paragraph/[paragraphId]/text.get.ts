import { defineEventHandler } from 'h3'
import { stirDrupalApiRequest } from '../../../../../foundation/server/utils/stirDrupalApi'
import { resolveDrupalCeConfig } from '../../../../../foundation/shared/utils/drupalCeConfig'
import {
  buildParagraphTextPath,
  createUpstreamParagraphTextError,
  parseParagraphId,
} from '../../../utils/paragraphTextApi'

export default defineEventHandler(async (event) => {
  const paragraphId = parseParagraphId(event.context.params?.paragraphId)
  const { ceApiEndpoint } = resolveDrupalCeConfig(useRuntimeConfig().public)

  try {
    return await stirDrupalApiRequest<{
      ok: boolean
      text?: string
      format?: string
      message?: string
    }>(event, buildParagraphTextPath(ceApiEndpoint, paragraphId), {
      method: 'GET',
      forwardCookies: true,
    })
  }
  catch (error) {
    throw createUpstreamParagraphTextError(error, 'Failed to read paragraph text.')
  }
})
