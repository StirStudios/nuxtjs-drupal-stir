import { defineEventHandler } from 'h3'
import { stirDrupalApiRequest } from '../../../../../foundation/server/utils/stirDrupalApi'
import { resolveDrupalCeApiConfig } from '../../../../../core/server/utils/drupalCeApiConfig'
import {
  buildParagraphTextPath,
  createUpstreamParagraphTextError,
  parseParagraphId,
} from '../../../utils/paragraphTextApi'

export default defineEventHandler(async (event) => {
  const paragraphId = parseParagraphId(event.context.params?.paragraphId)
  const { ceApiEndpoint } = resolveDrupalCeApiConfig(useRuntimeConfig())

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
