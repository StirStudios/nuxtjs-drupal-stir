import { createError, defineEventHandler, readBody } from 'h3'
import { stirDrupalApiRequest } from '../../../../../foundation/server/utils/stirDrupalApi'
import { resolveDrupalCeApiConfig } from '../../../../../core/server/utils/drupalCeApiConfig'
import type {
  ParagraphLayoutUpdate,
  ParagraphPresentationKey,
  ParagraphPresentationResponse,
} from '#stir/types'
import {
  buildParagraphPresentationPath,
  createUpstreamParagraphPresentationError,
} from '../../../utils/paragraphPresentationApi'
import { parseParagraphId } from '../../../utils/paragraphTextApi'

type PresentationValues = Partial<
  Record<ParagraphPresentationKey, boolean | string | string[]>
>

const isPlainObject = (value: unknown): boolean =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

export default defineEventHandler(async (event) => {
  assertStirSameOrigin(event)

  const paragraphId = parseParagraphId(event.context.params?.paragraphId)
  const body = await readBody<{ layout?: unknown, values?: unknown }>(event)

  const hasValues = body?.values !== undefined
  const hasLayout = body?.layout !== undefined

  if ((!hasValues && !hasLayout)
    || (hasValues && !isPlainObject(body.values))
    || (hasLayout && !isPlainObject(body.layout))) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Presentation values or a layout change are required.',
    })
  }

  const values = (body.values ?? {}) as PresentationValues
  const layout = body.layout as ParagraphLayoutUpdate | undefined
  const { ceApiEndpoint } = resolveDrupalCeApiConfig(useRuntimeConfig())

  try {
    return await stirDrupalApiRequest<ParagraphPresentationResponse>(
      event,
      buildParagraphPresentationPath(ceApiEndpoint, paragraphId),
      {
        method: 'POST',
        body: { values, ...(layout ? { layout } : {}) },
        enforceSameOrigin: false,
        forwardCookies: true,
      },
    )
  }
  catch (error) {
    throw createUpstreamParagraphPresentationError(error)
  }
})
