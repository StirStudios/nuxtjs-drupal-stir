import { describe, expect, it } from 'vitest'
import {
  commaSeparatedEnvironment,
  normalizeEnvironmentUrl,
  positiveIntegerEnvironment,
} from '../../config/runtime'
import {
  buildSitemapModuleOptions,
  dedupeResolvedSitemapUrls,
} from '../../config/sitemap'

describe('root configuration helpers', () => {
  it('normalizes environment values', () => {
    expect(normalizeEnvironmentUrl('https://example.com///')).toBe('https://example.com')
    expect(normalizeEnvironmentUrl(undefined)).toBe('')
    expect(positiveIntegerEnvironment('12', 5)).toBe(12)
    expect(positiveIntegerEnvironment('0', 5)).toBe(5)
    expect(positiveIntegerEnvironment('invalid', 5)).toBe(5)
    expect(commaSeparatedEnvironment('SESSa, SESSb ,')).toEqual(['SESSa', 'SESSb'])
  })

  it('builds sitemap sources only when Drupal is configured', () => {
    expect(buildSitemapModuleOptions('').sources).toEqual([])
    expect(buildSitemapModuleOptions('https://drupal.example').sources).toEqual([
      'https://drupal.example/api/sitemap',
    ])
  })

  it('deduplicates canonical paths and retains richer metadata', () => {
    const result = dedupeResolvedSitemapUrls([
      { loc: 'https://example.com/about/' },
      { loc: '/about', lastmod: '2026-01-01', priority: 0.8 },
      { loc: 'not a valid url' },
    ], 'https://example.com')

    expect(result).toHaveLength(2)
    expect(result[0]).toMatchObject({ loc: '/about', priority: 0.8 })
    expect(result[1]).toEqual({ loc: 'not a valid url' })
  })

  it('preserves invalid entries and the first equally rich canonical entry', () => {
    const invalid = { loc: 'http://[' }
    const result = dedupeResolvedSitemapUrls([
      { loc: 'https://example.com/' },
      { loc: '/', changefreq: 'daily' },
      { loc: '/search?q=one&amp;page=2', lastmod: '2026-01-01' },
      { loc: 'https://example.com/search?q=one&page=2', priority: 0.5 },
      invalid,
    ], 'https://example.com')

    expect(result).toEqual([
      { loc: '/', changefreq: 'daily' },
      { loc: '/search?q=one&amp;page=2', lastmod: '2026-01-01' },
      invalid,
    ])
  })
})
