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
