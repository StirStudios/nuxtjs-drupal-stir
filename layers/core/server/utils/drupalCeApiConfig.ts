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

export function resolveDrupalCeApiConfig(
  config: ReturnType<typeof useRuntimeConfig>,
) {
  const drupalCeConfig =
    config.public.drupalCe && typeof config.public.drupalCe === 'object'
      ? (config.public.drupalCe as Record<string, unknown>)
      : {}
  const drupalApi = getDrupalApiConfig()

  return {
    apiKey: drupalApi.apiKey,
    ceApiEndpoint: normalizeEndpoint(drupalCeConfig.ceApiEndpoint),
    drupalBaseUrl: normalizeBaseUrl(drupalApi.baseUrl),
    requestTimeoutMs: drupalApi.requestTimeoutMs,
  }
}
