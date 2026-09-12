import { defineEventHandler, readBody } from 'h3'
import { stirDrupalApiRequest } from '../../../../../../foundation/server/utils/stirDrupalApi'
import { resolveDrupalCeApiConfig } from '../../../../../../core/server/utils/drupalCeApiConfig'
import { createUpstreamParagraphTextError, parseTextValue } from '../../../../utils/paragraphTextApi'
import {
  buildFormattedTextPath,
  parseFormattedTextRouteTarget,
} from '../../../../utils/formattedTextApi'

interface FormattedTextPayload {
  text?: unknown
}

export default defineEventHandler(async (event) => {
  assertStirSameOrigin(event)

  const target = parseFormattedTextRouteTarget(event.context.params)
  const body = await readBody<FormattedTextPayload>(event)
  const text = parseTextValue(body?.text)
  const { ceApiEndpoint } = resolveDrupalCeApiConfig(useRuntimeConfig())

  try {
    return await stirDrupalApiRequest<{ ok: boolean, message?: string }>(
      event,
      buildFormattedTextPath(ceApiEndpoint, target),
      {
        method: 'POST',
        body: { text },
        enforceSameOrigin: false,
        forwardCookies: true,
      },
    )
  }
  catch (error) {
    throw createUpstreamParagraphTextError(error, 'Failed to save formatted text.')
  }
})
