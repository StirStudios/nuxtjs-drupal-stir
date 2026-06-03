import { defineEventHandler, getRequestURL, proxyRequest } from 'h3'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const drupalCeConfig =
    config.public.drupalCe && typeof config.public.drupalCe === 'object'
      ? (config.public.drupalCe as Record<string, unknown>)
      : {}
  const menuBaseUrl = resolveMenuBaseUrl(drupalCeConfig, config.public.api)
  const requestUrl = getRequestURL(event)
  const proxyPrefix = '/api/menu'
  const menuPath = requestUrl.pathname.startsWith(proxyPrefix)
    ? requestUrl.pathname.slice(proxyPrefix.length)
    : ''

  return await proxyRequest(event, `${menuBaseUrl}${menuPath}${requestUrl.search}`, {
    headers: {
      'Cache-Control': 'max-age=300',
    },
  })
})

function resolveMenuBaseUrl(
  drupalCeConfig: Record<string, unknown>,
  publicApi: unknown,
): string {
  if (drupalCeConfig.menuBaseUrl) {
    return String(drupalCeConfig.menuBaseUrl).replace(/\/+$/, '')
  }

  const baseUrl = String(
    import.meta.server && drupalCeConfig.serverDrupalBaseUrl
      ? drupalCeConfig.serverDrupalBaseUrl
      : drupalCeConfig.drupalBaseUrl || publicApi || '',
  ).replace(/\/+$/, '')
  const ceApiEndpoint = normalizeEndpoint(
    String(drupalCeConfig.ceApiEndpoint || '/ce-api'),
  )

  return `${baseUrl}${ceApiEndpoint}`
}

function normalizeEndpoint(value: string): string {
  const endpoint = value.trim() || '/ce-api'

  return endpoint.startsWith('/')
    ? endpoint.replace(/\/+$/, '')
    : `/${endpoint.replace(/\/+$/, '')}`
}
