/**
 * Host-independent path (plus query) used to match sitemap URLs.
 *
 * Kept free of `process` so server utilities can import it without pulling
 * Node-only configuration into a consumer's server typecheck. Relative `loc`
 * values resolve against `siteUrl`.
 */
export function sitemapCanonicalKey(loc: string, siteUrl = ''): string | null {
  try {
    const url = new URL(loc.replaceAll('&amp;', '&'), siteUrl || 'https://example.com')
    const pathname = url.pathname === '/' ? '/' : url.pathname.replace(/\/+$/, '')

    return url.search ? pathname + url.search : pathname
  } catch {
    return null
  }
}
