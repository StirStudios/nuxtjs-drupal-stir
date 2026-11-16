import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  MODAL_FRAME,
  mediaAspectRatio,
  paragraphUuids,
  resolveModalImageSizes,
  resolveLayoutImageDeliveryProfile,
  resolveGridImageDeliveryProfile,
  resolveCarouselImageDeliverySizes,
  resolveImageDeliveryProfile,
  resolveMediaGalleryDeliveryProfile,
  resolveStableMediaDeliveryProfile,
  versionImageSource,
  resolveCoverImageSizes,
} from '../../layers/theme/app/utils/imageDelivery'
import type { GridConfig } from '../../layers/theme/app/utils/gridClasses'
import { h } from 'vue'
import createStirIpxProvider, { withinSourceWidth } from '../../layers/theme/build/imageCdn'

describe('withinSourceWidth', () => {
  it('clamps a candidate wider than the source, keeping its aspect ratio', () => {
    expect(withinSourceWidth({ width: 6004, height: 2692, maxWidth: 2400, format: 'webp' }))
      .toEqual({ width: 2400, height: 1076, format: 'webp' })
  })

  it('drops the limit and keeps candidates within the source', () => {
    expect(withinSourceWidth({ width: 1499, height: 672, maxWidth: 2400 }))
      .toEqual({ width: 1499, height: 672 })
    expect(withinSourceWidth({ width: 640 })).toEqual({ width: 640 })
    expect(withinSourceWidth(undefined)).toBeUndefined()
  })
})

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

  it('sizes the asymmetric two-column presets to their wide column', () => {
    // two_column_8_4 / two_column_4_8 use an arbitrary grid-template value,
    // not a numeric column count, so only the layout key identifies them.
    const grid: GridConfig = { columns: { lg: '[8fr_4fr]' } }

    expect(resolveGridImageDeliveryProfile(grid, 'two_column_8_4', undefined)).toBe('splitWide')
    expect(resolveGridImageDeliveryProfile(grid, 'two_column_4_8', undefined, false)).toBe('splitWideFull')
    expect(resolveGridImageDeliveryProfile(undefined, 'two_column', undefined)).toBe('split')
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

describe('media modal image sizes', () => {
  it('reads an aspect ratio from Drupal dimensions, falling back to 16:9', () => {
    expect(mediaAspectRatio(2560, 3840)).toBeCloseTo(2 / 3)
    expect(mediaAspectRatio('1200', '800')).toBe(1.5)
    expect(mediaAspectRatio(undefined, 800)).toBeCloseTo(16 / 9)
    expect(mediaAspectRatio(0, 0)).toBeCloseTo(16 / 9)
  })

  it('asks a portrait photo on a wide screen for a small file, held back by the height', () => {
    // 1440 x 900 desktop: a 2:3 photo shows about 480px wide (80% of 900, times 2/3).
    expect(resolveModalImageSizes(2 / 3, 1440, 900)).toBe('640px')
  })

  it('keeps landscape photos at the frame\'s full width', () => {
    expect(resolveModalImageSizes(1.5, 1440, 900)).toBe('1152px')
    expect(resolveModalImageSizes(1.5, 1280, 720)).toBe('1152px')
    expect(resolveModalImageSizes(4, 1920, 1080)).toBe('1152px')
  })

  it('follows the gutter on a phone and snaps to widths the CDN has cached', () => {
    expect(resolveModalImageSizes(2 / 3, 390, 844)).toBe('640px')
    expect(resolveModalImageSizes(1.5, 800, 1000)).toBe('768px')
    expect(MODAL_FRAME.maxWidthPx).toBe(1152)
  })
})

describe('cover image sizes', () => {
  const screens = { sm: 640, md: 768, lg: 1024, xl: 1280, '2xl': 1536 }
  const breakHeight = { min: 320, vw: 40, max: 640 }

  it('matches the default media height classes', () => {
    const config = readFileSync(
      resolve(__dirname, '../../layers/theme/app/app.config.ts'),
      'utf8',
    )
    const coverHeights = [...config.matchAll(
      /(\w+): \{ min: (\d+), vw: (\d+), max: (\d+) \}/g,
    )]

    expect(coverHeights.map(match => match[1])).toEqual(['small', 'break', 'feature', 'hero'])

    // hero is an estimate: hero heights follow their content, not a class.
    for (const [, key, min, vw, max] of coverHeights.filter(match => match[1] !== 'hero')) {
      expect(config).toMatch(new RegExp(
        `${key}: '[^']*clamp\\(${Number(min) / 16}rem,${vw}vw,${Number(max) / 16}rem\\)`,
      ))
    }
  })

  it('asks for the shown width of a panorama in a full-bleed break box', () => {
    const sizes = resolveCoverImageSizes(
      'sm:100vw md:100vw lg:100vw xl:100vw 2xl:100vw',
      breakHeight,
      4000,
      772,
      screens,
    )!
    // @nuxt/image applies each entry from its own screen to the next one's,
    // so xl covers 1280-1535px. At 1400px the box is 1400x560 and the image
    // is shown about 2902px wide.
    const xl = Number(/(?:^| )xl:(\d+)px/.exec(sizes)![1])

    expect(xl).toBeGreaterThanOrEqual(560 * (4000 / 772))
    expect(sizes).toBe('sm:1659px md:2121px lg:2651px xl:3182px 2xl:208vw')
  })

  it('asks for the shown width in px, not vw that @nuxt/image multiplies by the screen width', () => {
    // A 2.23:1 hero 672px tall on a phone is shown about 1499px wide.
    expect(resolveCoverImageSizes('sm:100vw md:100vw', { min: 672, vw: 40, max: 800 }, 2400, 1076, screens))
      .toBe('sm:1499px md:196vw')
  })

  it('widens a fixed-width entry to the tallest box it covers', () => {
    expect(resolveCoverImageSizes('sm:100vw md:90vw xl:1200px', breakHeight, 4000, 772, screens))
      .toBe('sm:1659px md:2651px xl:3317px')
  })

  it('never asks for more than the source width', () => {
    expect(resolveCoverImageSizes('sm:100vw xl:1200px', breakHeight, 2000, 386, screens))
      .toBe('sm:2000px xl:2000px')
    expect(resolveCoverImageSizes('sm:100vw xl:1200px', breakHeight, 1200, 232, screens))
      .toBe('sm:100vw xl:1200px')
  })

  it('keeps sizes when the image is narrower than the box or not cover-cropped', () => {
    expect(resolveCoverImageSizes('sm:100vw xl:1200px', breakHeight, 1000, 1000, screens))
      .toBe('sm:100vw xl:1200px')
    expect(resolveCoverImageSizes('sm:100vw xl:1200px', undefined, 5000, 1000, screens))
      .toBe('sm:100vw xl:1200px')
  })
})

describe('paragraphUuids', () => {
  it('collects the uuids of rendered paragraphs, skipping blanks', () => {
    expect([...paragraphUuids([
      h('div', { uuid: 'a' }),
      h('div', { uuid: '' }),
      h('div'),
      h('div', { uuid: 'b' }),
    ])]).toEqual(['a', 'b'])
  })
})
