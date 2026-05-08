import { createError, defineEventHandler, readBody } from 'h3'
import { layerAuthBuildDrupalHeaders } from '../../../../utils/drupalHeaders'
import { layerAuthGetDrupalApiConfig, layerAuthGetForwardedCookie, layerAuthThrowDrupalApiError } from '../../../../utils/drupalApi'

type ReorderPayload = {
  slot?: 'avatar' | 'cover' | 'gallery'
  ordered_mids?: Array<number | string>
}

export default defineEventHandler(async (event) => {
  const body = await readBody<ReorderPayload>(event)
  const slot = body?.slot || 'gallery'
  const orderedRaw = Array.isArray(body?.ordered_mids) ? body.ordered_mids : []
  const orderedMids = orderedRaw
    .map(mid => typeof mid === 'string' ? Number.parseInt(mid, 10) : Number(mid))
    .filter(mid => Number.isInteger(mid) && mid > 0)

  if (slot !== 'gallery') {
    throw createError({ statusCode: 400, statusMessage: 'Reorder is only supported for gallery.' })
  }

  const { baseUrl, apiKey } = layerAuthGetDrupalApiConfig()
  const cookie = layerAuthGetForwardedCookie(event)

  try {
    const response = await $fetch.raw<Record<string, unknown>>(
      `${baseUrl}/api/account/profile/media/reorder`,
      {
        method: 'POST',
        body: {
          slot,
          ordered_mids: orderedMids,
        },
        headers: layerAuthBuildDrupalHeaders({
          apiKey,
          cookie,
        }),
      },
    )

    return response._data
  } catch (error: unknown) {
    const detail = (() => {
      if (!error || typeof error !== 'object' || !('data' in error)) {
        return ''
      }
      const data = (error as { data?: unknown }).data

      if (!data || typeof data !== 'object') {
        return ''
      }
      const record = data as Record<string, unknown>

      if (typeof record.error === 'string' && record.error.trim()) {
        return record.error
      }
      if (typeof record.message === 'string' && record.message.trim()) {
        return record.message
      }
      return ''
    })()

    if (detail) {
      layerAuthThrowDrupalApiError(error, detail)
    }

    layerAuthThrowDrupalApiError(error, 'Failed to reorder profile media')
  }
})
