const sitemapExcludedRoutes = [
  '/account/**',
  '/auth/**',
  '/login',
]

export function buildSitemapModuleOptions(drupalUrl: string) {
  return {
    // Keep Drupal dynamic while validating its payload at the Nuxt boundary.
    sources: drupalUrl ? ['/api/sitemap'] : [],
    excludeAppSources: ['nuxt:route-rules'],
    exclude: sitemapExcludedRoutes,
    runtimeCacheStorage: { driver: 'memory' },
    cacheMaxAgeSeconds: 0,
    xslColumns: [
      { label: 'URL', width: '50%' },
      {
        label: 'Last Modified',
        select: 'sitemap:lastmod',
        width: '25%',
      },
      {
        label: 'Priority',
        select: 'sitemap:priority',
        width: '12.5%',
      },
      {
        label: 'Change Frequency',
        select: 'sitemap:changefreq',
        width: '12.5%',
      },
    ],
  }
}

function sitemapCanonicalKey(loc: string, siteUrl: string): string | null {
  try {
    const url = new URL(loc.replaceAll('&amp;', '&'), siteUrl || 'https://example.com')
    const pathname = url.pathname === '/' ? '/' : url.pathname.replace(/\/+$/, '')

    return url.search ? pathname + url.search : pathname
  } catch {
    return null
  }
}

interface SitemapEntry {
  loc: string
  lastmod?: unknown
  changefreq?: unknown
  priority?: unknown
}

function sitemapMetadataScore(entry: SitemapEntry): number {
  return Number(Boolean(entry.lastmod)) +
    Number(Boolean(entry.changefreq)) +
    Number(entry.priority !== undefined)
}

export function dedupeResolvedSitemapUrls<T extends SitemapEntry>(
  urls: T[],
  siteUrl = process.env.NUXT_URL || '',
): T[] {
  const deduped: T[] = []
  const indexes = new Map<string, number>()

  for (const entry of urls) {
    const key = sitemapCanonicalKey(entry.loc, siteUrl)

    if (key === null) {
      deduped.push(entry)
      continue
    }

    const existingIndex = indexes.get(key)

    if (existingIndex === undefined) {
      indexes.set(key, deduped.length)
      deduped.push(entry)
      continue
    }

    const existingEntry = deduped[existingIndex]

    if (
      existingEntry &&
      sitemapMetadataScore(entry) > sitemapMetadataScore(existingEntry)
    ) {
      deduped[existingIndex] = entry
    }
  }

  return deduped
}
