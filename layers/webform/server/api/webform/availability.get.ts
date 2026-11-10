import { createError, defineEventHandler, getQuery } from 'h3'
import {
  assertStirDrupalResponseNotRedirect,
  buildStirDrupalHeaders,
  captureStirDrupalApiError,
  createStirDrupalUpstreamError,
  getStirDrupalApiConfig,
  markStirPrivateResponse,
  stirDrupalTimeoutOptions,
} from '../../../../foundation/server/utils/stirDrupalApi'
import { recordStirCacheTags } from '../../../../foundation/server/utils/stirCacheTags'

const MACHINE_NAME = /^[a-z0-9_]+$/
const MONTH = /^\d{4}-(?:0[1-9]|1[0-2])$/

export default defineEventHandler(async (event) => {
  const { webform, element, month } = getQuery(event)

  if (
    typeof webform !== 'string' || !MACHINE_NAME.test(webform)
    || typeof element !== 'string' || !MACHINE_NAME.test(element)
    || typeof month !== 'string' || !MONTH.test(month)
  ) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid availability request.' })
  }

  const { apiKey, baseUrl, requestTimeoutMs } = getStirDrupalApiConfig()

  try {
    const response = await $fetch.raw<{ unavailable: string[] }>(
      `${baseUrl}/api/stir/webform-availability/${webform}/${element}`,
      {
        query: { month },
        headers: buildStirDrupalHeaders({ apiKey }),
        redirect: 'manual',
        ...stirDrupalTimeoutOptions(requestTimeoutMs),
      },
    )

    assertStirDrupalResponseNotRedirect(response)
    recordStirCacheTags(event, response.headers)

    return response._data
  } catch (error) {
    // A failed read is operational state, never a cacheable answer.
    markStirPrivateResponse(event)
    captureStirDrupalApiError(event, error)
    throw createStirDrupalUpstreamError(error, 'Failed to load availability.')
  }
})
