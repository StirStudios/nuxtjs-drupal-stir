import { defineEventHandler, getRequestURL, proxyRequest } from 'h3'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const drupalCeConfig =
    config.public.drupalCe && typeof config.public.drupalCe === 'object'
      ? (config.public.drupalCe as Record<string, unknown>)
      : {}
  const drupalBaseUrl = String(
    import.meta.server && drupalCeConfig.serverDrupalBaseUrl
      ? drupalCeConfig.serverDrupalBaseUrl
      : drupalCeConfig.drupalBaseUrl || config.public.api || '',
  ).replace(/\/+$/, '')
  const ceApiEndpoint = normalizeEndpoint(
    String(drupalCeConfig.ceApiEndpoint || '/ce-api'),
  )
  const requestUrl = getRequestURL(event)
  const proxyPrefix = '/api/drupal-ce'
  const proxyPath = requestUrl.pathname.startsWith(proxyPrefix)
    ? requestUrl.pathname.slice(proxyPrefix.length)
    : ''
  const upstreamUrl = `${drupalBaseUrl}${ceApiEndpoint}${proxyPath}${requestUrl.search}`

  delete event.node.req.headers['x-forwarded-proto']

  return await proxyRequest(event, upstreamUrl)
})

function normalizeEndpoint(value: string): string {
  const endpoint = value.trim() || '/ce-api'

  return endpoint.startsWith('/')
    ? endpoint.replace(/\/+$/, '')
    : `/${endpoint.replace(/\/+$/, '')}`
}
