import { isStirDrupalProxyPathSafe } from '../../../core/server/utils/drupalCeProxy'

export const DRUPAL_PUBLIC_FILES_PATH = '/sites/default/files/'

// Request headers worth forwarding for a static file; cookies and credentials
// never reach Drupal from this route.
export const DRUPAL_PUBLIC_FILE_REQUEST_HEADERS = [
  'accept',
  'if-modified-since',
  'if-none-match',
  'range',
] as const

export const DRUPAL_PUBLIC_FILE_RESPONSE_HEADERS = [
  'accept-ranges',
  'cache-control',
  'content-disposition',
  'content-length',
  'content-range',
  'content-type',
  'etag',
  'expires',
  'last-modified',
] as const

const PASSED_STATUSES = new Set([200, 206, 301, 302, 304, 307, 308, 404, 410])

/**
 * Builds the Drupal URL for a public file path, or null when the path could
 * leave the public files directory.
 */
export function drupalPublicFileUrl(
  drupalBaseUrl: string,
  path: string,
  search = '',
): string | null {
  if (!path.startsWith(DRUPAL_PUBLIC_FILES_PATH)) return null
  if (!isStirDrupalProxyPathSafe(path.slice(DRUPAL_PUBLIC_FILES_PATH.length))) return null

  const base = new URL(drupalBaseUrl)
  const target = new URL(`${path}${search}`, base)

  return target.origin === base.origin && target.pathname.startsWith(DRUPAL_PUBLIC_FILES_PATH)
    ? target.href
    : null
}

/**
 * The status this route answers with for a Drupal response: files, ranges,
 * revalidations, redirects and missing files pass through; anything else is a
 * bad gateway, so a Drupal error page is never cached as a file.
 */
export function drupalPublicFileStatus(status: number): number {
  return PASSED_STATUSES.has(status) ? status : 502
}

/**
 * Rewrites a redirect that points into Drupal's own host to a path, so a moved
 * file redirects to the public host that asked for it, not the backend.
 */
export function drupalPublicFileLocation(
  location: string,
  drupalBaseUrl: string,
): string {
  try {
    const base = new URL(drupalBaseUrl)
    const target = new URL(location, base)

    return target.origin === base.origin
      ? `${target.pathname}${target.search}`
      : target.href
  }
  catch {
    return location
  }
}
