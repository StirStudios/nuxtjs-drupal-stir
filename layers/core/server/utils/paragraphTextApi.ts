import { createError } from 'h3'
import { getDrupalApiConfig } from './drupalApi'

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
  const drupalApi = getDrupalApiConfig()
  const drupalBaseUrl = normalizeBaseUrl(drupalApi.baseUrl)
  const ceApiEndpoint = normalizeEndpoint(drupalCeConfig.ceApiEndpoint)
  const apiKey = drupalApi.apiKey
  const requestTimeoutMs = drupalApi.requestTimeoutMs

  return {
    apiKey,
    ceApiEndpoint,
    drupalBaseUrl,
    requestTimeoutMs,
  }
}

export function buildParagraphTextPath(ceApiEndpoint: string, paragraphId: number): string {
  return `/api/drupal-ce${ceApiEndpoint}/stir-layout-builder/paragraph/${paragraphId}/text`
}

export function createUpstreamParagraphTextError(error: unknown, fallbackMessage: string) {
  const upstreamStatusCode =
    typeof (error as { statusCode?: unknown })?.statusCode === 'number'
      ? Number((error as { statusCode: number }).statusCode)
      : typeof (error as { status?: unknown })?.status === 'number'
        ? Number((error as { status: number }).status)
        : undefined
  const statusCode = upstreamStatusCode !== undefined
    && upstreamStatusCode >= 400
    && upstreamStatusCode < 500
    ? upstreamStatusCode
    : 502

  return createError({
    statusCode,
    statusMessage: fallbackMessage,
  })
}
