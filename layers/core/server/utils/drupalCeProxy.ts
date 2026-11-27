import {
  assertMethod,
  createError,
  getRequestURL,
  getResponseHeader,
  proxyRequest,
  type H3Event,
} from 'h3'
import {
  buildStirDrupalHeaders,
  filterStirDrupalSetCookies,
  getStirDrupalSetCookies,
  getStirDrupalApiConfig,
  getStirForwardedCookie,
  markStirPrivateResponse,
  replaceStirDrupalSetCookies,
  sendStirDrupalRequest,
} from '../../../foundation/server/utils/stirDrupalApi'
import { resolveDrupalCeConfig } from '../../../foundation/shared/utils/drupalCeConfig'

interface StirDrupalCeProxyTargets {
  ceBaseUrl: string
  menuBaseUrl: string
}

// The only visitor headers a CE page or menu read passes on: content
// negotiation, revalidation and the client's identity. Everything else (an
// Authorization or CSRF header, forwarding headers, any custom header) stays
// behind; the proxy adds the session cookie and API key itself.
const FORWARDED_REQUEST_HEADERS = [
  'accept',
  'accept-language',
  'if-modified-since',
  'if-none-match',
  'user-agent',
]
const MENU_NAME_PATTERN = '[A-Za-z0-9_-]+'
const SHARED_REVALIDATION_CACHE_CONTROL
  = 'public, max-age=0, must-revalidate, s-maxage=300'

const hasUnsafeProxyPathCharacter = (value: string): boolean =>
  Array.from(value).some((character) => {
    const code = character.charCodeAt(0)

    return code <= 31
      || code === 127
      || character === '\\'
      || character === '?'
      || character === '#'
  })

export const isStirDrupalProxyPathSafe = (path: string): boolean => {
  if (hasUnsafeProxyPathCharacter(path)) return false
  if (/%(?:2f|5c)/i.test(path)) return false

  let decodedPath: string

  try {
    decodedPath = decodeURIComponent(path)
  } catch {
    return false
  }

  if (hasUnsafeProxyPathCharacter(decodedPath)) return false
  if (/%(?:25|2e|2f|5c)/i.test(decodedPath)) return false

  return decodedPath
    .replace(/^\/+|\/+$/g, '')
    .split('/')
    .every(segment => segment !== '.' && segment !== '..')
}

const normalizeProxyPath = (path: string): string => {
  if (!isStirDrupalProxyPathSafe(path)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid Drupal proxy path',
    })
  }

  const normalized = path.replace(/^\/+/, '')

  return normalized ? `/${normalized}` : ''
}

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export const isStirDrupalMenuProxyPathAllowed = (
  path: string,
  menuEndpoint: string,
  useLocalizedMenuEndpoint = true,
): boolean => {
  if (!isStirDrupalProxyPathSafe(path)) return false

  const normalizedPath = path.replace(/^\/+|\/+$/g, '')
  const normalizedEndpoint = menuEndpoint.replace(/^\/+|\/+$/g, '')

  if (!normalizedPath || !normalizedEndpoint) return false
  if (!isStirDrupalProxyPathSafe(normalizedEndpoint)) return false

  const endpointPattern = normalizedEndpoint
    .split('$$$NAME$$$')
    .map(escapeRegExp)
    .join(MENU_NAME_PATTERN)
  const localePrefix = useLocalizedMenuEndpoint
    ? `(?:${MENU_NAME_PATTERN}/)?`
    : ''

  return new RegExp(`^${localePrefix}${endpointPattern}$`).test(normalizedPath)
}

const assertContainedProxyTarget = (
  baseUrl: string,
  path: string,
  search = '',
): string => {
  const normalizedPath = normalizeProxyPath(path)
  const base = new URL(baseUrl)
  const target = new URL(`${baseUrl}${normalizedPath}${search}`)
  const basePath = base.pathname.replace(/\/+$/, '')

  if (
    target.origin !== base.origin
    || (target.pathname !== basePath
      && !target.pathname.startsWith(`${basePath}/`))
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid Drupal proxy path',
    })
  }

  return target.toString()
}

export const getStirDrupalCeProxyTargets = (): StirDrupalCeProxyTargets => {
  const { ceApiEndpoint, menuBaseUrl } = resolveDrupalCeConfig(useRuntimeConfig().public)
  const ceBaseUrl = `${getStirDrupalApiConfig().baseUrl}${ceApiEndpoint}`

  return { ceBaseUrl, menuBaseUrl: menuBaseUrl || ceBaseUrl }
}

export const createStirDrupalProxyFetch = (
  event: H3Event,
): typeof globalThis.fetch => {
  return async (input, init) => {
    const incoming = new Headers(init?.headers)
    const headers = new Headers()
    const cookie = getStirForwardedCookie(event)
    const { apiKey, requestTimeoutMs } = getStirDrupalApiConfig()

    for (const name of FORWARDED_REQUEST_HEADERS) {
      const value = incoming.get(name)

      if (value) headers.set(name, value)
    }

    for (const [name, value] of Object.entries(buildStirDrupalHeaders({ apiKey, cookie }))) {
      headers.set(name, value)
    }

    const signal = init?.signal ?? (input instanceof Request ? input.signal : undefined)

    return await sendStirDrupalRequest({
      method: (init?.method ?? (input instanceof Request ? input.method : 'GET')).toUpperCase(),
      url: input instanceof Request ? input.url : String(input),
      requestTimeoutMs,
      signal,
    }, timeoutMs => globalThis.fetch(input, {
      ...init,
      headers,
      redirect: 'manual',
      signal: signal
        ? AbortSignal.any([signal, AbortSignal.timeout(timeoutMs)])
        : AbortSignal.timeout(timeoutMs),
    }))
  }
}

export const handleStirDrupalProxyResponse = (
  event: H3Event,
  response: Response,
): void => {
  const upstreamCacheControl = response.headers.get('cache-control') ?? ''
  const existingCacheControl = String(
    getResponseHeader(event, 'Cache-Control') ?? '',
  )
  const setsDrupalSession = filterStirDrupalSetCookies(
    getStirDrupalSetCookies(response.headers),
  ).length > 0

  replaceStirDrupalSetCookies(event, response)

  if (/(?:^|,)\s*no-store\b/i.test(existingCacheControl)) {
    return
  }

  if (
    event.context.stirPrivateResponse
    || getStirForwardedCookie(event)
    || setsDrupalSession
    || /(?:^|,)\s*(?:private|no-store)\b/i.test(upstreamCacheControl)
  ) {
    markStirPrivateResponse(event)
    return
  }

  if (
    (event.method === 'GET' || event.method === 'HEAD')
    && response.ok
    && !upstreamCacheControl.trim()
  ) {
    event.node?.res?.setHeader(
      'Cache-Control',
      SHARED_REVALIDATION_CACHE_CONTROL,
    )
  }
}

const stirDrupalProxyOptions = (event: H3Event) => ({
  fetch: createStirDrupalProxyFetch(event),
  onResponse: handleStirDrupalProxyResponse,
})

// Only JSON describes a page, and anything else would reach fetchPage() as a
// string it cannot read and end as a 500. A redirect from the CMS (its vhost
// redirecting a stray /index.php/ path, say) means no such page: 404. A 2xx
// that is not JSON (HTML served with a 200) means the CMS or its vhost is
// misbehaving: 502, so it is reported rather than passing for a missing page.
// A 304 is a cache revalidation, and 4xx and 5xx already take the error path
// with their own status.
export const assertStirDrupalPageResponse = (
  event: H3Event,
  response: Response,
): void => {
  if (event.method !== 'GET' && event.method !== 'HEAD') return

  const { status } = response

  if (status === 304 || status >= 400) return

  if (status >= 300) {
    event.node?.res?.removeHeader('location')

    throw createError({ statusCode: 404, statusMessage: 'Page not found' })
  }

  if (/json/i.test(response.headers.get('content-type') ?? '')) return

  // The CMS's own cache headers are already on the response; a cache must not
  // keep a misbehaving CMS's answer once it recovers.
  event.node?.res?.setHeader('Cache-Control', 'no-store')

  throw createError({ statusCode: 502, statusMessage: 'Unexpected response from the CMS' })
}

const stirDrupalCeProxyOptions = (event: H3Event) => ({
  ...stirDrupalProxyOptions(event),
  onResponse: (responseEvent: H3Event, response: Response) => {
    assertStirDrupalPageResponse(responseEvent, response)
    handleStirDrupalProxyResponse(responseEvent, response)
  },
})

// A CMS that does not answer within the request timeout reaches us from h3 as
// a 502 whose cause is the fetch's TimeoutError. Reported as a 504 instead, so
// a slow CMS is told apart from one that refused or dropped the connection.
const withGatewayTimeout = async <T>(proxy: Promise<T>): Promise<T> => {
  try {
    return await proxy
  } catch (error) {
    if ((error as { cause?: { name?: unknown } } | null)?.cause?.name !== 'TimeoutError') throw error

    const seconds = Math.round(getStirDrupalApiConfig().requestTimeoutMs / 1000)

    throw createError({
      statusCode: 504,
      statusMessage: 'Gateway Timeout',
      message: `CMS did not answer within ${seconds} s`,
      cause: error,
    })
  }
}

export const proxyStirDrupalCeRequest = async (
  event: H3Event,
  path = '',
) => {
  // Reads only: edits go through the dedicated editorial routes, which check
  // the origin and send Drupal's CSRF token.
  assertMethod(event, ['GET', 'HEAD'])

  const { ceBaseUrl } = getStirDrupalCeProxyTargets()
  const target = assertContainedProxyTarget(
    ceBaseUrl,
    path,
    getRequestURL(event).search,
  )

  return await withGatewayTimeout(proxyRequest(event, target, stirDrupalCeProxyOptions(event)))
}

export const proxyStirDrupalMenuRequest = async (
  event: H3Event,
  path: string,
) => {
  assertMethod(event, ['GET', 'HEAD'])

  if (!path.trim()) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Menu path is required',
    })
  }

  const { menuEndpoint, useLocalizedMenuEndpoint } = resolveDrupalCeConfig(useRuntimeConfig().public)

  if (!isStirDrupalMenuProxyPathAllowed(path, menuEndpoint, useLocalizedMenuEndpoint)) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Menu path was not found',
    })
  }

  const { menuBaseUrl } = getStirDrupalCeProxyTargets()
  const target = assertContainedProxyTarget(
    menuBaseUrl,
    path,
    getRequestURL(event).search,
  )

  // Drupal's response cache headers pass through; menus are access-filtered,
  // so caching them is Drupal's decision, not the proxy's. A menu is JSON like
  // a page, so a CMS redirect or an HTML answer is refused the same way.
  return await withGatewayTimeout(proxyRequest(event, target, stirDrupalCeProxyOptions(event)))
}
