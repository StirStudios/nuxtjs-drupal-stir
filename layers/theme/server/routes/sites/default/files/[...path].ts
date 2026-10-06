import {
  createError,
  defineEventHandler,
  getHeader,
  getRequestURL,
  sendStream,
  setResponseHeader,
  setResponseStatus,
} from 'h3'
import { getStirDrupalApiConfig } from '../../../../../../foundation/server/utils/stirDrupalApi'
import {
  DRUPAL_PUBLIC_FILE_REQUEST_HEADERS,
  DRUPAL_PUBLIC_FILE_RESPONSE_HEADERS,
  drupalPublicFileLocation,
  drupalPublicFileStatus,
  drupalPublicFileUrl,
} from '../../../../utils/drupalPublicFiles'

// Serves Drupal's public files from the Nuxt site, so the site's one pull CDN
// zone (origin: this site) answers both /_ipx/** and the original files Drupal
// names in payloads, structured data, sitemaps, favicons and mail. See
// docs/theme-layer.md "Nuxt image delivery".
export default defineEventHandler(async (event) => {
  if (!['GET', 'HEAD'].includes(event.method)) {
    throw createError({ statusCode: 405, statusMessage: 'Method Not Allowed' })
  }

  const { baseUrl, requestTimeoutMs } = getStirDrupalApiConfig()
  const url = getRequestURL(event)
  const target = drupalPublicFileUrl(baseUrl, url.pathname, url.search)

  if (!target) {
    throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  }

  const headers = new Headers()

  for (const name of DRUPAL_PUBLIC_FILE_REQUEST_HEADERS) {
    const value = getHeader(event, name)

    if (value) headers.set(name, value)
  }

  const upstream = await fetch(target, {
    headers,
    method: event.method,
    redirect: 'manual',
    signal: AbortSignal.timeout(requestTimeoutMs),
  }).catch(() => null)

  // The pull CDN caches originals; Cloudflare in front of the site must not
  // keep a second copy, or a purged file would come back stale.
  setResponseHeader(event, 'Cloudflare-CDN-Cache-Control', 'no-store')

  if (!upstream) {
    throw createError({ statusCode: 502, statusMessage: 'Bad Gateway' })
  }

  const status = drupalPublicFileStatus(upstream.status)

  setResponseStatus(event, status)

  if (status === 502) {
    await upstream.body?.cancel()
    return null
  }

  for (const name of DRUPAL_PUBLIC_FILE_RESPONSE_HEADERS) {
    const value = upstream.headers.get(name)

    if (value) setResponseHeader(event, name, value)
  }

  const location = upstream.headers.get('location')

  if (location) setResponseHeader(event, 'location', drupalPublicFileLocation(location, baseUrl))

  if (!upstream.body || event.method === 'HEAD' || status === 304) {
    await upstream.body?.cancel()
    return null
  }

  return sendStream(event, upstream.body)
})
