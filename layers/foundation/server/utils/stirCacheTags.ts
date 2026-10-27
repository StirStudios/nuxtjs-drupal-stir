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

/**
 * Prefix of the tag naming the site a response belongs to. Several frontends
 * share one Drupal (Domain module) and may share one Varnish; the tag lets a
 * purge reach one site's pages only. Its value is the host of the configured
 * Drupal API URL, the host Domain tells the sites apart by.
 */
export const STIR_SITE_CACHE_TAG_PREFIX = 'stir:site:'

/** The site tag for a Drupal API base URL, if it has a host. */
export const stirSiteCacheTag = (baseUrl: string): string | undefined => {
  const host = URL.canParse(baseUrl) ? new URL(baseUrl).host.toLowerCase() : ''

  return host ? `${STIR_SITE_CACHE_TAG_PREFIX}${host}` : undefined
}

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
 * list and config tags stay; if those still do not fit, the oversize tag and
 * the site tag remain. Either way the page is still purged when its content
 * changes.
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

  return reduced.length <= maxBytes
    ? reduced
    : [
        STIR_OVERSIZE_CACHE_TAG,
        ...unique.filter(tag => tag.startsWith(STIR_SITE_CACHE_TAG_PREFIX)),
      ].join(' ')
}

const contextTags = (event: H3Event): Set<string> => {
  const context = event.context as { stirCacheTags?: Set<string> }

  context.stirCacheTags ??= new Set()

  return context.stirCacheTags
}

/**
 * Returns the smallest `s-maxage` in Cache-Control values, if any.
 */
export const parseStirSharedMaxAge = (value: HeaderValue): number | undefined => {
  if (value === null || value === undefined) return undefined

  const values = Array.isArray(value) ? value : [String(value)]
  const ages = values
    .flatMap(item => [...String(item).matchAll(/(?:^|[\s,])s-maxage=(\d+)/gi)])
    .map(match => Number(match[1]))

  return ages.length > 0 ? Math.min(...ages) : undefined
}

const recordSharedMaxAge = (event: H3Event, age: number | undefined): void => {
  if (age === undefined) return

  const context = event.context as { stirSharedMaxAge?: number }

  context.stirSharedMaxAge = context.stirSharedMaxAge === undefined
    ? age
    : Math.min(context.stirSharedMaxAge, age)
}

/** When a response expires, as a Unix time (Stir Tools). */
export const STIR_CACHE_UNTIL_HEADER = 'x-stir-cache-until'

/**
 * Returns the seconds left until `x-stir-cache-until`, if the header is set.
 *
 * Drupal's page cache repeats a stored response with its headers unchanged,
 * so `s-maxage` may be a countdown that started hours ago (seconds until
 * midnight, worked out at 00:24 and repeated at 08:30). The clock time it
 * also sends stays right: counting down to it, a page never outlives it.
 */
export const parseStirCacheUntil = (value: HeaderValue, now = Date.now()): number | undefined => {
  if (value === null || value === undefined) return undefined

  const until = Number(Array.isArray(value) ? value[0] : value)

  if (!Number.isFinite(until) || until <= 0) return undefined

  return Math.max(0, Math.floor(until - now / 1000))
}

/**
 * Records the cache tags and Varnish lifetime of a Drupal (or internal)
 * response on this request.
 */
export const recordStirCacheTags = (
  event: H3Event,
  headers: { get?: (name: string) => string | null } | null | undefined,
): void => {
  if (!event.context) return

  recordSharedMaxAge(event, parseStirSharedMaxAge(headers?.get?.('cache-control')))
  recordSharedMaxAge(event, parseStirCacheUntil(headers?.get?.(STIR_CACHE_UNTIL_HEADER)))

  const tags = parseStirCacheTags(headers?.get?.(STIR_CACHE_TAGS_HEADER))

  if (tags.length === 0) return

  const recorded = contextTags(event)

  for (const tag of tags) recorded.add(tag)
}

/** Browsers keep a page at most this long; no purge reaches them. */
export const STIR_BROWSER_MAX_AGE = 60

const PRIVATE_DIRECTIVE = /(?:^|,)\s*(?:private|no-store|no-cache)\b/i

/**
 * Gives a public response the smallest Varnish lifetime of the Drupal
 * responses it was built from.
 *
 * Drupal sends `public, max-age=60, s-maxage=<N>` (Stir Tools); a page made
 * of several responses (page, menus, views, app context) may live only as
 * long as the shortest of them. Responses without `s-maxage` leave the
 * choice to the rest, or to Varnish's default when none has one. Private and
 * uncacheable responses are left alone.
 */
export const applyStirSharedMaxAge = (event: H3Event): void => {
  const current = getResponseHeader(event, 'Cache-Control') as HeaderValue
  const currentValue = Array.isArray(current) ? current.join(', ') : String(current ?? '')

  recordSharedMaxAge(event, parseStirSharedMaxAge(current))
  // The page's own end time, passed through from the Drupal CE fetch.
  recordSharedMaxAge(event, parseStirCacheUntil(getResponseHeader(event, STIR_CACHE_UNTIL_HEADER) as HeaderValue))

  const age = (event.context as { stirSharedMaxAge?: number }).stirSharedMaxAge

  if (age === undefined || PRIVATE_DIRECTIVE.test(currentValue) || !/\bpublic\b/i.test(currentValue)) {
    return
  }

  setResponseHeader(
    event,
    'Cache-Control',
    `public, max-age=${Math.min(STIR_BROWSER_MAX_AGE, age)}, s-maxage=${age}`,
  )
}

/**
 * Writes the request's tags as one header, or none on a private response.
 *
 * Tags appended by the Drupal CE page fetch and those recorded from other
 * requests are merged, so the header holds the union exactly once, with the
 * site tag added to any response that carries Drupal tags.
 */
export const applyStirCacheTagsHeader = (event: H3Event, siteTag?: string): void => {
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

  if (siteTag) tags.add(siteTag)

  setResponseHeader(event, STIR_CACHE_TAGS_HEADER, formatStirCacheTags(tags))
}
