import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  MODAL_FRAME,
  containerSlot,
  coverSlot,
  gridSlot,
  imageSlotSizes,
  mediaAspectRatio,
  resolveModalImageSizes,
  versionImageSource,
  viewportSlot,
  widthSlot,
  wrapGridSlot,
  IMAGE_WIDTH_LADDER,
  imageLadderWidths,
  ladderSrcset,
} from '../../layers/theme/app/utils/imageDelivery'
import createStirIpxProvider from '../../layers/theme/build/imageCdn'

describe('image width ladder', () => {
  it('stops at the source width and includes it', () => {
    expect(imageLadderWidths(1000)).toEqual([320, 480, 640, 750, 828, 1000])
    expect(imageLadderWidths(1200)).toEqual([320, 480, 640, 750, 828, 1080, 1200])
  })

  it('caps at the largest ladder width and uses the whole ladder for unknown sources', () => {
    expect(imageLadderWidths(6000).at(-1)).toBe(3840)
    expect(imageLadderWidths(undefined)).toEqual(IMAGE_WIDTH_LADDER)
  })

  it('builds a width-descriptor srcset keeping the aspect ratio', () => {
    expect(ladderSrcset((width, height) => `/i/${width}x${height}`, 700, 350))
      .toBe('/i/320x160 320w, /i/480x240 480w, /i/640x320 640w, /i/700x350 700w')
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
    // 1440 x 900 desktop: a 2:3 photo shows 480px wide (80% of 900, times 2/3).
    expect(resolveModalImageSizes(2 / 3, 1440, 900)).toBe('480px')
  })

  it('caps landscape photos at the frame\'s width or the viewport height', () => {
    expect(resolveModalImageSizes(1.5, 1440, 900)).toBe('1080px')
    expect(resolveModalImageSizes(4, 1920, 1080)).toBe('1152px')
    expect(MODAL_FRAME.maxWidthPx).toBe(1152)
  })

  it('follows the gutter on a phone', () => {
    expect(resolveModalImageSizes(2 / 3, 390, 844)).toBe('358px')
    expect(resolveModalImageSizes(1.5, 800, 1000)).toBe('768px')
  })
})

describe('cover heights', () => {
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

})

describe('image slots', () => {
  const container = { maxWidth: 1536, padding: { default: 16, md: 20, lg: 32 } }
  const contained = containerSlot(viewportSlot, container)

  it('matches the theme container classes and --ui-container', () => {
    const config = readFileSync(resolve(__dirname, '../../layers/theme/app/app.config.ts'), 'utf8')
    const css = readFileSync(resolve(__dirname, '../../layers/theme/app/assets/css/main.css'), 'utf8')

    expect(config).toContain('container: \'mx-auto max-w-(--ui-container) px-4 md:px-5 lg:px-8\'')
    expect(config).toMatch(/maxWidth: 1536,\s+padding: \{ default: 16, md: 20, lg: 32 \}/)
    expect(css).toContain('--ui-container: var(--container-8xl)')
  })

  it('narrows a container to its max width inside its padding', () => {
    expect(contained(390)).toBe(358)
    expect(contained(800)).toBe(760)
    expect(contained(1400)).toBe(1336)
    expect(contained(2560)).toBe(1472)
  })

  it('splits a grid by its responsive columns and gaps', () => {
    const grid = { columns: { default: 1, md: 2, lg: 3 }, gap: { default: 4, lg: 8 } }
    const cell = gridSlot(contained, grid)

    expect(cell(390)).toBe(358)
    expect(cell(800)).toBe((760 - 16) / 2)
    expect(cell(1400)).toBe((1336 - 64) / 3)
  })

  it('gives each region of a fixed-ratio template its share, and full-span regions the whole grid', () => {
    const grid = { columns: { lg: '[8fr_4fr]' }, gap: { lg: 6 } }

    expect(gridSlot(contained, grid, { region: 0 })(1400)).toBe(((1336 - 24) * 8) / 12)
    expect(gridSlot(contained, grid, { region: 1 })(1400)).toBe(((1336 - 24) * 4) / 12)
    expect(gridSlot(contained, grid)(1400)).toBe(((1336 - 24) * 8) / 12)
    expect(gridSlot(contained, grid, { region: 0, span: true })(1400)).toBe(1336)
  })

  it('caps the slot at the Width field from its breakpoint', () => {
    const narrow = widthSlot(contained, 'md')

    expect(narrow(800)).toBe(760)
    expect(narrow(1400)).toBe(768)
    expect(widthSlot(contained, 'unknown')).toBe(contained)
  })

  it('composes nested layouts: a 3-column gallery in one half of a contained split', () => {
    const half = wrapGridSlot(undefined, container, { grid: { columns: { md: 2 }, gap: { md: 8 } } })
    const gallery = wrapGridSlot(half, container, { grid: { columns: { lg: 3 }, gap: { lg: 4 } } })

    expect(gallery(1400)).toBe(((1336 - 32) / 2 - 32) / 3)
  })

  it('widens a cover-cropped image to the box height times its ratio, up to the source', () => {
    const height = { min: 320, vw: 40, max: 640 }
    const panorama = coverSlot(viewportSlot, height, 4000, 772)

    expect(panorama(390)).toBeCloseTo(320 * (4000 / 772))
    expect(panorama(1400)).toBeCloseTo(560 * (4000 / 772))
    expect(coverSlot(viewportSlot, height, 1000, 1000)(1400)).toBe(1400)
    expect(coverSlot(viewportSlot, height, 2000, 386)(1400)).toBe(2000)
  })
})

describe('imageSlotSizes', () => {
  const container = { maxWidth: 1536, padding: { default: 16, md: 20, lg: 32 } }

  it('writes exact calc() lengths per breakpoint band and px once the container caps', () => {
    expect(imageSlotSizes(containerSlot(viewportSlot, container))).toBe(
      '(max-width: 767px) calc(100vw - 32px), (max-width: 1023px) calc(100vw - 40px), '
      + '(max-width: 1535px) calc(100vw - 64px), 1472px',
    )
  })

  it('writes 100vw for the viewport and leads with auto for lazy images', () => {
    expect(imageSlotSizes(viewportSlot)).toBe('100vw')
    expect(imageSlotSizes(viewportSlot, true)).toBe('auto, 100vw')
  })

  it('writes a band\'s widest width where the slot is not linear', () => {
    const sizes = imageSlotSizes(coverSlot(viewportSlot, { min: 320, vw: 40, max: 640 }, 4000, 772))

    // The box stays 320px tall up to 800px wide, so the image is 1659px wide
    // there; from 800px it grows with the viewport.
    expect(sizes.startsWith('(max-width: 767px) 1659px, (max-width: 1023px) 2121px')).toBe(true)
  })
})
