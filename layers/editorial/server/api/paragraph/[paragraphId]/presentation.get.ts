import { defineEventHandler } from 'h3'
import { stirDrupalApiRequest } from '../../../../../foundation/server/utils/stirDrupalApi'
import { resolveDrupalCeConfig } from '../../../../../foundation/shared/utils/drupalCeConfig'
import type { ParagraphPresentationResponse } from '#stir/types'
import {
  buildParagraphPresentationPath,
  createUpstreamParagraphPresentationError,
} from '../../../utils/paragraphPresentationApi'
import { parseParagraphId } from '../../../utils/paragraphTextApi'

export default defineEventHandler(async (event) => {
  const paragraphId = parseParagraphId(event.context.params?.paragraphId)
  const { ceApiEndpoint } = resolveDrupalCeConfig(useRuntimeConfig().public)

  try {
    return await stirDrupalApiRequest<ParagraphPresentationResponse>(
      event,
      buildParagraphPresentationPath(ceApiEndpoint, paragraphId),
      {
        method: 'GET',
        forwardCookies: true,
      },
    )
  }
  catch (error) {
    throw createUpstreamParagraphPresentationError(error)
  }
})
