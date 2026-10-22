import { describe, expect, it } from 'vitest'
import {
  canonicalEnvironment,
  commaSeparatedEnvironment,
  developmentHostEnvironment,
  normalizeEnvironmentUrl,
  positiveIntegerEnvironment,
  siteNameEnvironment,
  siteUrlEnvironment,
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
      '/api/sitemap',
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

describe('canonical environment names', () => {
  it('reads the old name alone', () => {
    const env = { NUXT_URL: 'https://old.example', NUXT_NAME: 'Old', SERVER_DOMAIN_CLIENT: 'old.ddev.site' }

    expect(siteUrlEnvironment(env)).toBe('https://old.example')
    expect(siteNameEnvironment(env)).toBe('Old')
    expect(developmentHostEnvironment(env)).toBe('old.ddev.site')
  })

  it('reads the canonical name alone', () => {
    const env = { NUXT_SITE_URL: 'https://new.example', NUXT_SITE_NAME: 'New' }

    expect(siteUrlEnvironment(env)).toBe('https://new.example')
    expect(siteNameEnvironment(env)).toBe('New')
    expect(developmentHostEnvironment(env)).toBe('new.example')
  })

  it('prefers the canonical name', () => {
    const env = {
      NUXT_SITE_URL: 'https://new.example',
      NUXT_URL: 'https://old.example',
      NUXT_SITE_NAME: 'Same',
      NUXT_NAME: 'Same',
      SERVER_DOMAIN_CLIENT: 'old.ddev.site',
    }

    expect(siteUrlEnvironment(env)).toBe('https://new.example')
    expect(siteNameEnvironment(env)).toBe('Same')
    expect(developmentHostEnvironment(env)).toBe('new.example')
  })

  it('falls back when nothing is set', () => {
    expect(siteUrlEnvironment({})).toBe('')
    expect(siteNameEnvironment({})).toBeUndefined()
    expect(developmentHostEnvironment({})).toBe('localhost')
    expect(canonicalEnvironment(['A', 'B'], { A: ' ', B: 'b' })).toBe('b')
  })
})
