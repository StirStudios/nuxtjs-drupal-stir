import { describe, expect, it } from 'vitest'
import {
  resolveLayoutImageDeliveryProfile,
  resolveCarouselImageDeliverySizes,
  resolveImageDeliveryProfile,
  versionImageSource,
} from '../../layers/theme/app/utils/imageDelivery'
import createStirIpxProvider from '../../layers/theme/build/imageCdn'

describe('versionImageSource', () => {
  it('adds a managed-file revision without changing the original path', () => {
    expect(versionImageSource(
      'https://drupal.example/sites/default/files/photo.jpg',
      '42-1710000000-293400',
    )).toBe(
      'https://drupal.example/sites/default/files/photo.jpg?v=42-1710000000-293400',
    )
  })

  it('replaces a stale revision while preserving other query values and fragments', () => {
    expect(versionImageSource(
      '/files/photo.jpg?download=1&v=old#preview',
      '43-1720000000-300000',
    )).toBe(
      '/files/photo.jpg?download=1&v=43-1720000000-300000#preview',
    )
  })

  it('returns an unversioned source when revision metadata is unavailable', () => {
    expect(versionImageSource('/files/photo.jpg', undefined)).toBe('/files/photo.jpg')
    expect(versionImageSource(undefined, '42-1710000000-293400')).toBeUndefined()
  })
})

describe('resolveImageDeliveryProfile', () => {
  const profiles = {
    card: 'sm:100vw md:50vw lg:33vw xl:400px',
    hero: 'sm:100vw md:100vw lg:100vw xl:100vw',
  }

  it('prefers the hero profile for hero context', () => {
    expect(resolveImageDeliveryProfile('card', true, profiles)).toBe(profiles.hero)
  })

  it('uses a known Drupal responsive style and rejects unknown styles', () => {
    expect(resolveImageDeliveryProfile('card', false, profiles)).toBe(profiles.card)
    expect(resolveImageDeliveryProfile('unknown', false, profiles)).toBeUndefined()
  })
})

describe('resolveLayoutImageDeliveryProfile', () => {
  it('uses card delivery for grids with three or more columns', () => {
    expect(resolveLayoutImageDeliveryProfile(
      'grid',
      'grid-cols-1 md:grid-cols-3 xl:grid-cols-5',
    )).toBe('card')
  })

  it('uses split delivery for two-column layouts', () => {
    expect(resolveLayoutImageDeliveryProfile(
      'two_column',
      'grid-cols-1 lg:grid-cols-2',
    )).toBe('split')
  })

  it('does not constrain ordinary one-column content', () => {
    expect(resolveLayoutImageDeliveryProfile(
      'default',
      'grid-cols-1',
    )).toBeUndefined()
  })
})

describe('resolveCarouselImageDeliverySizes', () => {
  const full = 'sm:100vw md:100vw lg:100vw xl:100vw'

  it('uses the full profile for the default single-slide carousel', () => {
    expect(resolveCarouselImageDeliverySizes(undefined, full)).toBe(full)
    expect(resolveCarouselImageDeliverySizes('basis-full', full)).toBe(full)
  })

  it('derives responsive image widths when several slides are visible', () => {
    expect(resolveCarouselImageDeliverySizes(
      'basis-1/2 md:basis-1/3 lg:basis-1/5',
      full,
    )).toBe('sm:50vw md:33vw lg:20vw')
    expect(resolveCarouselImageDeliverySizes('w-1/3', full)).toBe('sm:33vw')
  })
})

describe('Stir IPX provider', () => {
  it('keeps the managed-file revision out of the Drupal origin path', () => {
    const provider = createStirIpxProvider()
    const image = provider.getImage(
      'https://drupal.example/sites/default/files/photo.jpg?v=42-1710000000-293400',
      {
        baseURL: 'https://cdn.example/_ipx',
        modifiers: { format: 'webp', width: 640, height: 360 },
      },
      {
        options: {
          nuxt: { baseURL: '/' },
        },
      } as Parameters<typeof provider.getImage>[2],
    )

    expect(image.url).toBe(
      'https://cdn.example/_ipx/f_webp&s_640x360/https://drupal.example/sites/default/files/photo.jpg?v=42-1710000000-293400',
    )
    expect(image.url).not.toContain('photo.jpg%3Fv')
  })
})
