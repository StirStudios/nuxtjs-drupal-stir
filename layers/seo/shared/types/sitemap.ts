export interface SitemapProducerEntry {
  loc: string
  lastmod: string | null
  changefreq: string | null
  priority: number | null
}

export type SitemapProducerPayload = SitemapProducerEntry[]

/** Subset of the @nuxtjs/sitemap image entry accepted from extensions. */
export interface SitemapImageEntry {
  loc: string
  caption?: string
  title?: string
  geo_location?: string
  license?: string
}

/** @nuxtjs/sitemap video entry; either `content_loc` or `player_loc` is required. */
export interface SitemapVideoEntry {
  title: string
  description: string
  thumbnail_loc: string
  content_loc?: string
  player_loc?: string
  duration?: number
  publication_date?: string
  expiration_date?: string
  family_friendly?: boolean | 'yes' | 'no'
  requires_subscription?: boolean | 'yes' | 'no'
  live?: boolean | 'yes' | 'no'
  [key: string]: unknown
}

/** Extra fields an extension contributes to a Drupal sitemap URL, matched by `loc` path. */
export interface SitemapExtensionEntry {
  loc: string
  images?: SitemapImageEntry[]
  videos?: SitemapVideoEntry[]
}

export interface SitemapEntry extends SitemapProducerEntry {
  images?: SitemapImageEntry[]
  videos?: SitemapVideoEntry[]
}
