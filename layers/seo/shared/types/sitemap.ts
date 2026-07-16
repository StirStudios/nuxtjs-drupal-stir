export interface SitemapProducerEntry {
  loc: string
  lastmod: string | null
  changefreq: string | null
  priority: number | null
}

export type SitemapProducerPayload = SitemapProducerEntry[]
