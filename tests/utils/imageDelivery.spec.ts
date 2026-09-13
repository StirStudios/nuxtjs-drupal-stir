import { describe, expect, it } from 'vitest'
import {
  resolveLayoutImageDeliveryProfile,
  resolveGridImageDeliveryProfile,
  resolveCarouselImageDeliverySizes,
  resolveImageDeliveryProfile,
  resolveMediaGalleryDeliveryProfile,
  resolveStableMediaDeliveryProfile,
  versionImageSource,
} from '../../layers/theme/app/utils/imageDelivery'
import type { GridConfig } from '../../layers/theme/app/utils/gridClasses'
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

describe('resolveMediaGalleryDeliveryProfile', () => {
  it('keeps stacked gallery images on the container profile', () => {
    expect(resolveMediaGalleryDeliveryProfile({ columns: { default: 1 } }, 2))
      .toBe('container')
  })

  it('uses split and card profiles for multi-column galleries', () => {
    expect(resolveMediaGalleryDeliveryProfile({ columns: { default: 2 } }, 2))
      .toBe('split')
    expect(resolveMediaGalleryDeliveryProfile({ columns: { md: 3 } }, 3))
      .toBe('card')
  })

  it('preserves the item-count fallback without authored grid columns', () => {
    expect(resolveMediaGalleryDeliveryProfile(undefined, 2)).toBe('split')
    expect(resolveMediaGalleryDeliveryProfile(undefined, 3)).toBe('card')
    expect(resolveMediaGalleryDeliveryProfile({ columns: { default: 1 } }, 1)).toBeUndefined()
  })

  it('uses active masonry lanes instead of retained grid columns', () => {
    expect(resolveMediaGalleryDeliveryProfile({ columns: { default: 1 } }, 3, 3))
      .toBe('card')
    expect(resolveMediaGalleryDeliveryProfile({ columns: { default: 4 } }, 3, 1))
      .toBe('container')
  })
})

describe('resolveStableMediaDeliveryProfile', () => {
  it('uses only server-safe authored layout inputs', () => {
    expect(resolveStableMediaDeliveryProfile({ columns: { default: 1, sm: 3 } }, false))
      .toBe('card')
    expect(resolveStableMediaDeliveryProfile({ columns: { default: 2 } }, false))
      .toBe('split')
    expect(resolveStableMediaDeliveryProfile(undefined, false)).toBe('container')
    expect(resolveStableMediaDeliveryProfile({ columns: { default: 4 } }, true)).toBe('container')
  })
})

describe('resolveGridImageDeliveryProfile', () => {
  it('uses card delivery for grids with three or more columns', () => {
    expect(resolveGridImageDeliveryProfile(
      { columns: { default: 1, md: 3, xl: 5 } },
      'grid',
      undefined,
    )).toBe('card')
  })

  it('uses split delivery for contained two-column layouts', () => {
    expect(resolveGridImageDeliveryProfile(
      { columns: { default: 1, lg: 2 } },
      'two_column',
      undefined,
    )).toBe('split')
  })

  it('uses full-width split delivery for edge-to-edge two-column layouts', () => {
    expect(resolveGridImageDeliveryProfile(
      { columns: { default: 1, lg: 2 } },
      'two_column',
      undefined,
      false,
    )).toBe('splitFull')
  })

  it('uses split delivery for the asymmetric two-column presets', () => {
    // two_column_8_4 / two_column_4_8 use an arbitrary grid-template value,
    // not a numeric column count, so only the layout key identifies them.
    const grid: GridConfig = { columns: { lg: '[8fr_4fr]' } }

    expect(resolveGridImageDeliveryProfile(grid, 'two_column_8_4', undefined)).toBe('split')
  })

  it('does not constrain ordinary one-column content', () => {
    expect(resolveGridImageDeliveryProfile(
      { columns: { default: 1 } },
      'default',
      undefined,
    )).toBeUndefined()
  })

  it('uses split delivery for a constrained one-column layout', () => {
    expect(resolveGridImageDeliveryProfile(
      { columns: { default: 1 } },
      'one_column',
      'sm',
    )).toBe('split')
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

  it('uses split delivery for contained two-column layouts', () => {
    expect(resolveLayoutImageDeliveryProfile(
      'two_column',
      'grid-cols-1 lg:grid-cols-2',
    )).toBe('split')
  })

  it('uses full-width split delivery for edge-to-edge two-column layouts', () => {
    expect(resolveLayoutImageDeliveryProfile(
      'two_column',
      'grid-cols-1 lg:grid-cols-2',
      false,
    )).toBe('splitFull')
  })

  it('does not constrain ordinary one-column content', () => {
    expect(resolveLayoutImageDeliveryProfile(
      'default',
      'grid-cols-1',
    )).toBeUndefined()
  })

  it('uses split delivery for a constrained one-column layout', () => {
    expect(resolveLayoutImageDeliveryProfile(
      'one_column',
      'grid grid-cols-1 sm:max-w-lg',
    )).toBe('split')
  })
})

describe('resolveCarouselImageDeliverySizes', () => {
  const full = 'sm:100vw md:100vw lg:100vw xl:100vw'

  it('uses the full profile for the default single-slide carousel', () => {
    expect(resolveCarouselImageDeliverySizes(undefined, full)).toBe(full)
    expect(resolveCarouselImageDeliverySizes({ columns: { default: 1 } }, full)).toBe(full)
  })

  it('derives responsive image widths when several slides are visible', () => {
    expect(resolveCarouselImageDeliverySizes(
      { columns: { default: 2, md: 3, lg: 5 } },
      full,
    )).toBe('sm:50vw md:33vw lg:20vw')
    expect(resolveCarouselImageDeliverySizes({ columns: { default: 3 } }, full)).toBe('sm:33vw')
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
