import { defineEventHandler, readMultipartFormData, createError } from 'h3'
import { layerAuthBuildDrupalHeaders } from '../../../../utils/drupalHeaders'
import {
  layerAuthExtractDrupalErrorDetail,
  layerAuthGetDrupalApiConfig,
  layerAuthGetForwardedCookie,
  layerAuthThrowDrupalApiError,
} from '../../../../utils/drupalApi'

const IMAGE_MIME_BY_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  avif: 'image/avif',
  heic: 'image/heic',
  heif: 'image/heif',
  svg: 'image/svg+xml',
}

const resolveUploadMimeType = (filename: string, rawType: string): string => {
  const type = rawType.trim().toLowerCase()

  if (type && type !== 'application/octet-stream') {
    return type
  }

  const extension = filename.split('.').pop()?.toLowerCase() || ''

  return IMAGE_MIME_BY_EXTENSION[extension] || 'application/octet-stream'
}

export default defineEventHandler(async (event) => {
  const parts = await readMultipartFormData(event)

  if (!parts || parts.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'No files were uploaded.' })
  }

  const { baseUrl, apiKey } = layerAuthGetDrupalApiConfig()
  const cookie = layerAuthGetForwardedCookie(event)

  const formData = new FormData()
  let appendedFileCount = 0
  const partMeta: Array<{ name: string; filename: string; type: string }> = []

  for (const part of parts) {
    partMeta.push({
      name: String(part.name || ''),
      filename: String(part.filename || ''),
      type: String(part.type || ''),
    })

    if (!part.filename) {
      if (part.name === 'slot') {
        const slotValue = new TextDecoder().decode(part.data).trim()

        if (slotValue) {
          formData.append('slot', slotValue)
        }
      }
      continue
    }

    const fieldName = part.name === 'photos' || part.name === 'file' || part.name === 'files[]' || part.name === 'files' ? 'files[]' : (part.name || 'files[]')
    const blob = new Blob([new Uint8Array(part.data)], {
      type: resolveUploadMimeType(part.filename, String(part.type || '')),
    })

    formData.append(fieldName, blob, part.filename)
    appendedFileCount += 1
  }

  if (appendedFileCount === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Upload payload contained no file parts.',
      data: {
        error: 'Upload payload contained no file parts.',
        parts: partMeta,
      },
    })
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
    const detail = layerAuthExtractDrupalErrorDetail(error)

    if (detail) {
      layerAuthThrowDrupalApiError(error, detail)
    }

    layerAuthThrowDrupalApiError(error, 'Failed to upload profile photos')
  }
})
