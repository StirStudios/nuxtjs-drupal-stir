import { createError, defineEventHandler, getHeader, readBody } from 'h3'

interface ParagraphTextPayload {
  text?: unknown
}

function normalizeEndpoint(value: unknown): string {
  const raw = typeof value === 'string' ? value.trim() : ''

  if (!raw) return '/ce-api'

  const withLeadingSlash = raw.startsWith('/') ? raw : `/${raw}`

  return withLeadingSlash.replace(/\/+$/, '') || '/ce-api'
}

function normalizeBaseUrl(value: unknown): string {
  const raw = typeof value === 'string' ? value.trim() : ''

  return raw.replace(/\/+$/, '')
}

export default defineEventHandler(async (event) => {
  const paragraphIdRaw = event.context.params?.paragraphId
  const paragraphId = Number(paragraphIdRaw)

  if (!Number.isInteger(paragraphId) || paragraphId <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid paragraph id.',
    })
  }

  const body = await readBody<ParagraphTextPayload>(event)
  const text = typeof body?.text === 'string' ? body.text.trim() : ''

  if (!text) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Text is required.',
    })
  }

  const config = useRuntimeConfig()
  const drupalCeConfig =
    config.public.drupalCe && typeof config.public.drupalCe === 'object'
      ? (config.public.drupalCe as Record<string, unknown>)
      : {}
  const drupalBaseUrl = normalizeBaseUrl(drupalCeConfig.drupalBaseUrl || config.public.api)
  const ceApiEndpoint = normalizeEndpoint(drupalCeConfig.ceApiEndpoint)
  const savePath = `/api/drupal-ce${ceApiEndpoint}/stir-layout-builder/paragraph/${paragraphId}/text`
  const cookie = getHeader(event, 'cookie')
  const apiKey = typeof config.apiKey === 'string' && config.apiKey.trim()
    ? config.apiKey
    : ''

  if (!drupalBaseUrl) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Drupal API base URL is not configured',
    })
  }

  try {
    const csrfToken = await $fetch<string>(`${drupalBaseUrl}/session/token`, {
      headers: {
        ...(cookie ? { cookie: String(cookie) } : {}),
        ...(apiKey ? { 'x-api-key': apiKey } : {}),
      },
    })

    return await $fetch<{ ok: boolean; message?: string }>(savePath, {
      method: 'POST',
      body: { text },
      headers: {
        ...(cookie ? { cookie: String(cookie) } : {}),
        ...(csrfToken ? { 'x-csrf-token': String(csrfToken) } : {}),
      },
    })
  } catch (error) {
    const statusCode =
      typeof (error as { statusCode?: unknown })?.statusCode === 'number'
        ? Number((error as { statusCode: number }).statusCode)
        : typeof (error as { status?: unknown })?.status === 'number'
          ? Number((error as { status: number }).status)
          : 502
    const statusMessage =
      typeof (error as { statusMessage?: unknown })?.statusMessage === 'string' &&
      (error as { statusMessage?: string }).statusMessage?.trim()
        ? String((error as { statusMessage: string }).statusMessage)
        : typeof (error as { message?: unknown })?.message === 'string' &&
            (error as { message?: string }).message?.trim()
          ? String((error as { message: string }).message)
          : 'Failed to save paragraph text.'

    throw createError({
      statusCode,
      statusMessage,
    })
  }
})
