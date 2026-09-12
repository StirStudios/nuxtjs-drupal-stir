import { defineEventHandler } from 'h3'
import { stirDrupalApiRequest } from '../../../../../../foundation/server/utils/stirDrupalApi'
import { resolveDrupalCeApiConfig } from '../../../../../../core/server/utils/drupalCeApiConfig'
import { createUpstreamParagraphTextError } from '../../../../utils/paragraphTextApi'
import {
  buildFormattedTextPath,
  parseFormattedTextRouteTarget,
} from '../../../../utils/formattedTextApi'

export default defineEventHandler(async (event) => {
  const target = parseFormattedTextRouteTarget(event.context.params)
  const { ceApiEndpoint } = resolveDrupalCeApiConfig(useRuntimeConfig())

  try {
    return await stirDrupalApiRequest<{
      ok: boolean
      text?: string
      format?: string
      required?: boolean
      message?: string
    }>(event, buildFormattedTextPath(ceApiEndpoint, target), {
      method: 'GET',
      forwardCookies: true,
    })
  }
  catch (error) {
    throw createUpstreamParagraphTextError(error, 'Failed to read formatted text.')
  }
})
