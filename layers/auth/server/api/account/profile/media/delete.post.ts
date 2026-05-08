import { createError, defineEventHandler, readBody } from 'h3'
import { layerAuthBuildDrupalHeaders } from '../../../../utils/drupalHeaders'
import {
  layerAuthExtractDrupalErrorDetail,
  layerAuthGetDrupalApiConfig,
  layerAuthGetForwardedCookie,
  layerAuthThrowDrupalApiError,
} from '../../../../utils/drupalApi'

type DeletePayload = {
  slot?: 'avatar' | 'cover' | 'gallery'
  mid?: number | string
}

export default defineEventHandler(async (event) => {
  const body = await readBody<DeletePayload>(event)
  const slot = body?.slot || 'gallery'
  const midRaw = body?.mid
  const mid = typeof midRaw === 'string' ? Number.parseInt(midRaw, 10) : Number(midRaw)

  if (!Number.isInteger(mid) || mid <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'A valid media id is required.' })
  }

  const { baseUrl, apiKey } = layerAuthGetDrupalApiConfig()
  const cookie = layerAuthGetForwardedCookie(event)

  try {
    const response = await $fetch.raw<Record<string, unknown>>(
      `${baseUrl}/api/account/profile/media/delete`,
      {
        method: 'POST',
        body: {
          slot,
          mid,
        },
        headers: layerAuthBuildDrupalHeaders({
          apiKey,
          cookie,
        }),
      },
    )

    return response._data
  } catch (error: unknown) {
    const detail = layerAuthExtractDrupalErrorDetail(error)

    if (detail) {
      layerAuthThrowDrupalApiError(error, detail)
    }

    layerAuthThrowDrupalApiError(error, 'Failed to remove profile media item')
  }
})
