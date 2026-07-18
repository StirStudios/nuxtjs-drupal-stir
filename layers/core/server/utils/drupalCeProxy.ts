import {
  assertMethod,
  createError,
  getRequestURL,
  proxyRequest,
  type H3Event,
} from 'h3'
import {
  filterStirDrupalSetCookies,
  getStirDrupalSetCookies,
  getStirDrupalApiConfig,
  getStirForwardedCookie,
  markStirPrivateResponse,
  replaceStirDrupalSetCookies,
} from '../../../foundation/server/utils/stirDrupalApi'

interface StirDrupalCeProxyTargets {
  ceBaseUrl: string
  menuBaseUrl: string
}

const DEFAULT_MENU_ENDPOINT = 'api/menu_items/$$$NAME$$$'
const FORWARDED_HEADERS = [
  'forwarded',
  'x-forwarded-for',
  'x-forwarded-host',
  'x-forwarded-port',
  'x-forwarded-prefix',
  'x-forwarded-proto',
  'x-real-ip',
]
const MENU_NAME_PATTERN = '[A-Za-z0-9_-]+'
const SHARED_REVALIDATION_CACHE_CONTROL
  = 'public, max-age=0, must-revalidate, s-maxage=300'

const normalizeBaseUrl = (value: unknown): string =>
  typeof value === 'string' ? value.trim().replace(/\/+$/, '') : ''

const normalizeEndpoint = (value: unknown): string => {
  const endpoint = typeof value === 'string' && value.trim()
    ? value.trim()
    : '/ce-api'

  return `/${endpoint.replace(/^\/+|\/+$/g, '')}`
}

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
  const config = useRuntimeConfig()
  const privateConfig = config as Record<string, unknown>
  const publicConfig = config.public as Record<string, unknown>
  const drupalCeConfig = publicConfig.drupalCe
    && typeof publicConfig.drupalCe === 'object'
    ? publicConfig.drupalCe as Record<string, unknown>
    : {}
  const apiBaseUrl = normalizeBaseUrl(drupalCeConfig.serverDrupalBaseUrl)
    || normalizeBaseUrl(drupalCeConfig.drupalBaseUrl)
    || normalizeBaseUrl(privateConfig.api)
    || normalizeBaseUrl(publicConfig.api)

  if (!apiBaseUrl) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Drupal API base URL is not configured',
    })
  }

  const ceBaseUrl = `${apiBaseUrl}${normalizeEndpoint(
    drupalCeConfig.ceApiEndpoint,
  )}`
  const menuBaseUrl = normalizeBaseUrl(drupalCeConfig.menuBaseUrl) || ceBaseUrl

  return { ceBaseUrl, menuBaseUrl }
}

export const createStirDrupalProxyFetch = (
  event: H3Event,
): typeof globalThis.fetch => {
  return async (input, init) => {
    const headers = new Headers(init?.headers)
    const cookie = getStirForwardedCookie(event)
    const { apiKey } = getStirDrupalApiConfig()

    headers.delete('cookie')
    headers.delete('x-api-key')
    FORWARDED_HEADERS.forEach(header => headers.delete(header))

    if (cookie) headers.set('cookie', cookie)
    if (apiKey) headers.set('x-api-key', apiKey)

    return await globalThis.fetch(input, {
      ...init,
      headers,
      redirect: 'manual',
    })
  }
}

export const handleStirDrupalProxyResponse = (
  event: H3Event,
  response: Response,
): void => {
  const upstreamCacheControl = response.headers.get('cache-control') ?? ''
  const setsDrupalSession = filterStirDrupalSetCookies(
    getStirDrupalSetCookies(response.headers),
  ).length > 0

  replaceStirDrupalSetCookies(event, response)

  if (
    getStirForwardedCookie(event)
    || setsDrupalSession
    || /(?:^|,)\s*(?:private|no-store)\b/i.test(upstreamCacheControl)
  ) {
    markStirPrivateResponse(event)
    return
  }

  if (
    (event.method === 'GET' || event.method === 'HEAD')
    && response.ok
  ) {
    event.node.res.setHeader(
      'Cache-Control',
      SHARED_REVALIDATION_CACHE_CONTROL,
    )
  }
}

const stirDrupalProxyOptions = (event: H3Event) => ({
  fetch: createStirDrupalProxyFetch(event),
  onResponse: handleStirDrupalProxyResponse,
})

export const proxyStirDrupalCeRequest = async (
  event: H3Event,
  path = '',
) => {
  const { ceBaseUrl } = getStirDrupalCeProxyTargets()
  const target = assertContainedProxyTarget(
    ceBaseUrl,
    path,
    getRequestURL(event).search,
  )

  return await proxyRequest(event, target, stirDrupalProxyOptions(event))
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

  const publicConfig = useRuntimeConfig().public as Record<string, unknown>
  const drupalCeConfig = publicConfig.drupalCe
    && typeof publicConfig.drupalCe === 'object'
    ? publicConfig.drupalCe as Record<string, unknown>
    : {}
  const menuEndpoint = typeof drupalCeConfig.menuEndpoint === 'string'
    ? drupalCeConfig.menuEndpoint
    : DEFAULT_MENU_ENDPOINT

  if (!isStirDrupalMenuProxyPathAllowed(
    path,
    menuEndpoint,
    drupalCeConfig.useLocalizedMenuEndpoint !== false,
  )) {
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

  return await proxyRequest(event, target, {
    ...stirDrupalProxyOptions(event),
    headers: {
      'Cache-Control': 'max-age=300',
    },
  })
}
