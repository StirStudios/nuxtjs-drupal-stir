import { describe, expect, it, vi } from 'vitest'
import type { GlobalSeoResponse } from '../../layers/seo/shared/types/globalSeo'
import { prepareGlobalSeoAssets } from '../../layers/seo/app/utils/globalSeoAssets'

const response: GlobalSeoResponse = {
  lang: 'en',
  meta: [
    { property: 'og:image', content: 'https://drupal.example/files/og.jpg' },
    { name: 'twitter:image', content: 'https://drupal.example/files/og.jpg' },
    { property: 'og:title', content: 'Example' },
  ],
  link: [
    { rel: 'image_src', href: 'https://drupal.example/files/og.jpg' },
    { rel: 'icon', href: 'https://drupal.example/files/favicon.ico' },
    { rel: 'ICON', href: 'https://drupal.example/files/favicon.svg' },
    { rel: 'apple-touch-icon', href: 'https://drupal.example/files/touch.png' },
    { rel: 'canonical', href: 'https://www.example.com/' },
  ],
}

describe('prepareGlobalSeoAssets', () => {
  it('routes social images through the configured image provider with a revision', () => {
    const image = vi.fn((source: string) => `https://images.example/_ipx/${source}`)
    const result = prepareGlobalSeoAssets(response, {
      socialImage: { enabled: true, version: 'asset-42' },
    }, image, 'https://www.example.com')

    expect(image).toHaveBeenCalledTimes(3)
    expect(image.mock.calls[0]?.[0]).toBe(
      'https://drupal.example/files/og.jpg?v=asset-42',
    )
    expect(result.meta[0]?.content).toContain('https://images.example/_ipx/')
    expect(result.link[0]?.href).toContain('https://images.example/_ipx/')
  })

  it('makes local IPX output absolute on the public frontend origin', () => {
    const result = prepareGlobalSeoAssets(response, {
      socialImage: { enabled: true },
    }, () => '/_ipx/f_jpeg/og.jpg', 'https://www.example.com')

    expect(result.meta[0]?.content).toBe('https://www.example.com/_ipx/f_jpeg/og.jpg')
    expect(result.meta).toContainEqual({ property: 'og:image:type', content: 'image/jpeg' })
    expect(result.meta).toContainEqual({ property: 'og:image:width', content: '1200' })
    expect(result.meta).toContainEqual({ property: 'og:image:height', content: '630' })
  })

  it('replaces stale Drupal dimensions with the published rendition facts', () => {
    const stale: GlobalSeoResponse = {
      ...response,
      meta: [
        ...response.meta,
        { property: 'og:image:type', content: 'image/png' },
        { property: 'og:image:width', content: '180' },
        { property: 'og:image:height', content: '180' },
      ],
    }
    const result = prepareGlobalSeoAssets(stale, {
      socialImage: { enabled: true, format: 'webp', width: 1600, height: 900 },
    }, source => source, 'https://www.example.com')

    expect(result.meta).toContainEqual({ property: 'og:image:type', content: 'image/webp' })
    expect(result.meta).toContainEqual({ property: 'og:image:width', content: '1600' })
    expect(result.meta).toContainEqual({ property: 'og:image:height', content: '900' })
  })

  it('preserves malformed versioned sources instead of aborting head rendering', () => {
    const malformed: GlobalSeoResponse = {
      ...response,
      meta: [{ property: 'og:image', content: 'not a valid absolute URL' }],
    }
    const result = prepareGlobalSeoAssets(malformed, {
      socialImage: { enabled: true, version: 'asset-42' },
    }, source => `/_ipx/${source}`, 'https://www.example.com')

    expect(result.meta[0]?.content).toBe('not a valid absolute URL')
  })

  it('honors the top-level SEO disable flag', () => {
    const image = vi.fn((source: string) => `/_ipx/${source}`)
    const result = prepareGlobalSeoAssets(response, {
      enabled: false,
      socialImage: { enabled: true },
    }, image, 'https://www.example.com')

    expect(result).toEqual(response)
    expect(image).not.toHaveBeenCalled()
  })

  it('resolves Drupal file links against the Drupal origin', () => {
    const relative: GlobalSeoResponse = {
      ...response,
      link: [
        { rel: 'icon', href: '/sites/default/files/meta/favicon.ico' },
        { rel: 'canonical', href: '/privacy-policy' },
      ],
    }
    const result = prepareGlobalSeoAssets(
      relative,
      { enabled: false },
      source => source,
      'https://www.example.com',
      'https://cms.example.com',
    )

    expect(result.link).toEqual([
      { rel: 'icon', href: 'https://cms.example.com/sites/default/files/meta/favicon.ico' },
      { rel: 'canonical', href: '/privacy-policy' },
    ])
  })

  it('preserves Drupal-owned icon links', () => {
    const result = prepareGlobalSeoAssets(
      response,
      {},
      source => source,
      'https://www.example.com',
    )

    expect(result.link).toEqual([
      { rel: 'image_src', href: 'https://drupal.example/files/og.jpg' },
      { rel: 'icon', href: 'https://drupal.example/files/favicon.ico' },
      { rel: 'ICON', href: 'https://drupal.example/files/favicon.svg' },
      { rel: 'apple-touch-icon', href: 'https://drupal.example/files/touch.png' },
      { rel: 'canonical', href: 'https://www.example.com/' },
    ])
  })

  it('preserves Drupal URLs when asset delivery is not enabled', () => {
    expect(prepareGlobalSeoAssets(
      response,
      {},
      source => source,
      'https://www.example.com',
    )).toEqual(response)
  })
})
