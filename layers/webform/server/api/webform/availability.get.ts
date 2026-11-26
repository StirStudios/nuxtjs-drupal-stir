import { createError, defineEventHandler, getQuery } from 'h3'
import {
  createStirDrupalUpstreamError,
  markStirPrivateResponse,
  stirDrupalApiRequest,
} from '../../../../foundation/server/utils/stirDrupalApi'

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

  try {
    return await stirDrupalApiRequest<{ unavailable: string[] }>(
      event,
      `/api/stir/webform-availability/${webform}/${element}`,
      { method: 'GET', query: { month } },
    )
  } catch (error) {
    // A failed read is operational state, never a cacheable answer.
    markStirPrivateResponse(event)
    throw createStirDrupalUpstreamError(error, 'Failed to load availability.')
  }
})
