import { defineEventHandler } from 'h3'
import { stirDrupalApiRequest } from '../../../../../../foundation/server/utils/stirDrupalApi'
import { resolveDrupalCeConfig } from '../../../../../../foundation/shared/utils/drupalCeConfig'
import { createUpstreamParagraphTextError } from '../../../../utils/paragraphTextApi'
import {
  buildFormattedTextPath,
  parseFormattedTextRouteTarget,
} from '../../../../utils/formattedTextApi'

export default defineEventHandler(async (event) => {
  const target = parseFormattedTextRouteTarget(event.context.params)
  const { ceApiEndpoint } = resolveDrupalCeConfig(useRuntimeConfig().public)

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
