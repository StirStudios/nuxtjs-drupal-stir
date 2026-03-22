import { createError } from 'h3'

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

export function parseParagraphId(value: unknown): number {
  const paragraphId = Number(value)

  if (!Number.isInteger(paragraphId) || paragraphId <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid paragraph id.',
    })
  }

  return paragraphId
}

export function resolveParagraphTextApiConfig(config: ReturnType<typeof useRuntimeConfig>) {
  const drupalCeConfig =
    config.public.drupalCe && typeof config.public.drupalCe === 'object'
      ? (config.public.drupalCe as Record<string, unknown>)
      : {}
  const drupalBaseUrl = normalizeBaseUrl(drupalCeConfig.drupalBaseUrl || config.public.api)
  const ceApiEndpoint = normalizeEndpoint(drupalCeConfig.ceApiEndpoint)
  const apiKey = typeof config.apiKey === 'string' && config.apiKey.trim()
    ? config.apiKey
    : ''

  if (!drupalBaseUrl) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Drupal API base URL is not configured',
    })
  }

  return {
    apiKey,
    ceApiEndpoint,
    drupalBaseUrl,
  }
}

export function buildParagraphTextPath(ceApiEndpoint: string, paragraphId: number): string {
  return `/api/drupal-ce${ceApiEndpoint}/stir-layout-builder/paragraph/${paragraphId}/text`
}

export function createUpstreamParagraphTextError(error: unknown, fallbackMessage: string) {
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
        : fallbackMessage

  return createError({
    statusCode,
    statusMessage,
  })
}
