import { defineEventHandler, readMultipartFormData, createError } from 'h3'
import { layerAuthBuildDrupalHeaders } from '../../../../utils/drupalHeaders'
import { layerAuthGetDrupalApiConfig, layerAuthGetForwardedCookie, layerAuthThrowDrupalApiError } from '../../../../utils/drupalApi'

export default defineEventHandler(async (event) => {
  const parts = await readMultipartFormData(event)
  if (!parts || parts.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'No files were uploaded.' })
  }

  const { baseUrl, apiKey } = layerAuthGetDrupalApiConfig()
  const cookie = layerAuthGetForwardedCookie(event)

  const formData = new FormData()

  for (const part of parts) {
    if (!part.filename) {
      if (part.name === 'slot') {
        const slotValue = new TextDecoder().decode(part.data).trim()
        if (slotValue) {
          formData.append('slot', slotValue)
        }
      }
      continue
    }

    const fieldName = part.name === 'photos' || part.name === 'file' || part.name === 'files[]' || part.name === 'files' ? 'files' : (part.name || 'files')
    const blob = new Blob([new Uint8Array(part.data)], {
      type: part.type || 'application/octet-stream',
    })
    formData.append(fieldName, blob, part.filename)
  }

  try {
    const response = await $fetch.raw<Record<string, unknown>>(
      `${baseUrl}/api/account/profile/media`,
      {
        method: 'POST',
        body: formData,
        headers: layerAuthBuildDrupalHeaders({
          apiKey,
          cookie,
        }),
      },
    )

    return response._data
  } catch (error: unknown) {
    layerAuthThrowDrupalApiError(error, 'Failed to upload profile photos')
  }
})
