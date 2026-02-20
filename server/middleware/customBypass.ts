import { defineEventHandler, readFormData, createError } from 'h3'

function normalizeStatusCode(error: unknown): number {
  if (!error || typeof error !== 'object') return 500
  const statusCode = (error as { statusCode?: unknown }).statusCode

  return typeof statusCode === 'number' ? statusCode : 500
}

function normalizeMessage(error: unknown): string {
  if (!error || typeof error !== 'object') return 'Error submitting to Drupal.'
  const message = (error as { message?: unknown }).message

  return typeof message === 'string' && message.trim()
    ? message
    : 'Error submitting to Drupal.'
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const drupalApiUrl = config.public.api
  const url = event.node.req.url || ''
  const method = event.node.req.method || 'GET'
  const contentTypeHeader = event.req.headers['content-type']
  const contentType = Array.isArray(contentTypeHeader)
    ? contentTypeHeader.join(';')
    : (contentTypeHeader ?? '')

  // Only handle form submissions (not JSON)
  const isFormContentType =
    contentType.includes('multipart/form-data') ||
    contentType.includes('application/x-www-form-urlencoded')

  // Skip handling if it's not a form POST
  if (method !== 'POST' || !isFormContentType) return

  // Only proxy specific forms to Drupal (optional)
  if (!url.startsWith('/api/webform/submit')) return

  const formData = await readFormData(event)

  if (!formData) {
    throw createError({
      statusCode: 400,
      message: 'Form data expected but not found.',
    })
  }

  const response = await $fetch
    .raw(`${drupalApiUrl}${url}`, {
      method: 'POST',
      body: formData,
      headers: {
        'x-form-processed': 'true',
      },
    })
    .catch((error) => {
      throw createError({
        statusCode: normalizeStatusCode(error),
        message: normalizeMessage(error),
      })
    })

  event.context.drupalCeCustomPageResponse = {
    _data: response._data,
    headers: Object.fromEntries(response.headers.entries()),
  }
})
