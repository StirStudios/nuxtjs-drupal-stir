import type { H3Event } from 'h3'
import { getResponseHeader, removeResponseHeader, setResponseHeader } from 'h3'

/**
 * Drupal cache tags on a response, space-separated and lowercase.
 *
 * Drupal sends the tags of what a response was built from (`node:5`,
 * `node_list:article`, `config:system.menu.main`); every response this server
 * builds from Drupal carries the union of them. The Nuxt Varnish stores them
 * with the cached object, and Drupal purges by tag when that content changes,
 * so only the pages that showed it are purged.
 */
export const STIR_CACHE_TAGS_HEADER = 'x-cache-tags'

/**
 * Header budget: nginx in front of Nuxt rejects a header block over its 4 KB
 * proxy buffer with a 502, so the tags stay well under it.
 */
export const STIR_CACHE_TAGS_MAX_BYTES = 3000

/**
 * Replaces per-entity tags on a page whose tags do not fit. Drupal sends it
 * with every tag purge, so such a page is still purged on any change.
 */
export const STIR_OVERSIZE_CACHE_TAG = 'stir:oversize'

const VALID_TAG = /^[a-z0-9_:.-]+$/
const ENTITY_TAG = /^[a-z0-9_]+:\d+$/

type HeaderValue = string | number | readonly string[] | null | undefined

/**
 * Splits header values (several values may be comma-joined) into tags.
 */
export const parseStirCacheTags = (value: HeaderValue): string[] => {
  if (value === null || value === undefined) return []

  const values = Array.isArray(value) ? value : [String(value)]

  return values
    .flatMap(item => String(item).toLowerCase().split(/[\s,]+/))
    .filter(tag => VALID_TAG.test(tag))
}

/**
 * Joins tags into one header value within the byte budget.
 *
 * Over budget, per-entity tags (`node:5`) give way to the oversize tag and the
 * list and config tags stay; if those still do not fit, the oversize tag alone
 * remains. Either way the page is still purged when its content changes.
 */
export const formatStirCacheTags = (
  tags: Iterable<string>,
  maxBytes = STIR_CACHE_TAGS_MAX_BYTES,
): string => {
  const unique = [...new Set(tags)].sort()
  const joined = unique.join(' ')

  if (joined.length <= maxBytes) return joined

  const reduced = [
    STIR_OVERSIZE_CACHE_TAG,
    ...unique.filter(tag => !ENTITY_TAG.test(tag) && tag !== STIR_OVERSIZE_CACHE_TAG),
  ].join(' ')

  return reduced.length <= maxBytes ? reduced : STIR_OVERSIZE_CACHE_TAG
}

const contextTags = (event: H3Event): Set<string> => {
  const context = event.context as { stirCacheTags?: Set<string> }

  context.stirCacheTags ??= new Set()

  return context.stirCacheTags
}

/**
 * Records the cache tags of a Drupal (or internal) response on this request.
 */
export const recordStirCacheTags = (
  event: H3Event,
  headers: { get?: (name: string) => string | null } | null | undefined,
): void => {
  const tags = parseStirCacheTags(headers?.get?.(STIR_CACHE_TAGS_HEADER))

  if (tags.length === 0 || !event.context) return

  const recorded = contextTags(event)

  for (const tag of tags) recorded.add(tag)
}

/**
 * Writes the request's tags as one header, or none on a private response.
 *
 * Tags appended by the Drupal CE page fetch and those recorded from other
 * requests are merged, so the header holds the union exactly once.
 */
export const applyStirCacheTagsHeader = (event: H3Event): void => {
  const tags = contextTags(event)

  for (const tag of parseStirCacheTags(
    getResponseHeader(event, STIR_CACHE_TAGS_HEADER) as HeaderValue,
  )) {
    tags.add(tag)
  }

  const cacheControl = String(getResponseHeader(event, 'Cache-Control') ?? '')

  if (tags.size === 0 || /(?:^|,)\s*(?:private|no-store)\b/i.test(cacheControl)) {
    removeResponseHeader(event, STIR_CACHE_TAGS_HEADER)
    return
  }

  setResponseHeader(event, STIR_CACHE_TAGS_HEADER, formatStirCacheTags(tags))
}
