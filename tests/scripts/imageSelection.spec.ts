import { describe, expect, it } from 'vitest'
import { createImage } from '@nuxt/image/runtime'
import { mediaMatches, parseSrcset, pickCandidate, sizesWidth } from '../../scripts/perf/imageSelection.mjs'
import createStirIpxProvider from '../../layers/theme/build/imageCdn'
import {
  containerSlot,
  coverCropSources,
  coverSlot,
  imageSlotSizes,
  ladderSrcset,
  viewportSlot,
  wrapGridSlot,
} from '../../layers/theme/app/utils/imageDelivery'

const screens = { sm: 640, md: 768, lg: 1024, xl: 1280, '2xl': 1536 }
const VIEWPORTS = [320, 390, 640, 768, 900, 1024, 1180, 1280, 1400, 1536, 1920, 2560]
const DPRS = [1, 2, 3]

describe('browser image selection', () => {
  it('reads the slot width from the first matching media query', () => {
    const sizes = '(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 736px'

    expect(sizesWidth(sizes, 390)).toBe(390)
    expect(sizesWidth(sizes, 1000)).toBe(500)
    expect(sizesWidth(sizes, 1920)).toBe(736)
  })

  it('picks the smallest candidate that covers the need, with DPR capped at 2', () => {
    const candidates = parseSrcset('/a 640w, /b 1280w, /c 1920w')

    expect(pickCandidate(candidates, 600, 1).url).toBe('/a')
    expect(pickCandidate(candidates, 600, 2).url).toBe('/b')
    expect(pickCandidate(candidates, 600, 3).url).toBe('/b')
    expect(pickCandidate(candidates, 1200, 2).url).toBe('/c')
  })

  it('reads resolution conditions in sizes', () => {
    const sizes = '(min-resolution: 1.5dppx) and (max-width: 767px) 50vw, (max-width: 767px) 100vw, 1000px'

    expect(sizesWidth(sizes, 400, 2)).toBe(200)
    expect(sizesWidth(sizes, 400, 1)).toBe(400)
    expect(sizesWidth(sizes, 1200, 2)).toBe(1000)
  })
})

// The layer's real delivery path: `sizes` from the image slot, srcset from
// the width ladder through the layer's provider, then a browser's pick, then
// IPX's output (it never enlarges).
const $img = createImage({
  screens,
  densities: [1, 2],
  domains: [],
  alias: {},
  presets: {},
  provider: 'stir',
  providers: { stir: { setup: () => createStirIpxProvider(), defaults: {} } },
  nuxt: { baseURL: '/' },
} as unknown as Parameters<typeof createImage>[0])

function deliveredAt(sizes: string, source: { width: number, height: number }, viewport: number, dpr: number) {
  const srcset = ladderSrcset(
    (width, height) => $img('/photo.jpg', { width, height }),
    source.width,
    source.height,
  )
  const candidate = pickCandidate(parseSrcset(srcset), sizesWidth(sizes, viewport), dpr)
  const requested = Number(/s_(\d+)x/.exec(candidate.url)?.[1] ?? candidate.width)

  return Math.min(requested, source.width)
}

// What each layout really shows, written out by hand from the theme's
// container (96rem, px-4 md:px-5 lg:px-8) and a gap-8 (2rem) grid.
const content = (viewport: number) =>
  Math.min(viewport, 1536) - (viewport >= 1024 ? 64 : viewport >= 768 ? 40 : 32)
const columns = (count: number, viewport: number) => (content(viewport) - 32 * (count - 1)) / count
const LAYOUTS: Record<string, (viewport: number) => number> = {
  full: viewport => viewport,
  container: content,
  split: viewport => viewport >= 768 ? columns(2, viewport) : content(viewport),
  card: viewport => viewport >= 1024 ? columns(3, viewport) : viewport >= 768 ? columns(2, viewport) : content(viewport),
}

function sweep(sizes: string, shown: (viewport: number) => number, source = { width: 4000, height: 2667 }) {
  let under = 1
  let over = 1

  for (const viewport of VIEWPORTS) {
    for (const dpr of DPRS) {
      const needed = Math.min(source.width, Math.ceil(shown(viewport) * Math.min(dpr, 2)))
      const ratio = deliveredAt(sizes, source, viewport, dpr) / needed

      under = Math.min(under, ratio)
      over = Math.max(over, ratio)
    }
  }

  return `under ${under.toFixed(2)}, over ${over.toFixed(2)}`
}

// Today's delivery measured against what is shown, as the baseline for the
// image delivery restructure (docs/image-delivery-plan.md). Each phase updates
// these numbers; they should move towards under 1.00 and over within one
// width-ladder step.
describe('hero delivery', () => {
  it('gives a hero about one image pixel per CSS pixel on phones and full sharpness at 1x', () => {
    const height = { min: 672, vw: 40, max: 800 }
    const source = { width: 5000, height: 3000 }
    const slot = coverSlot(viewportSlot, height, source.width, source.height)
    const sizes = imageSlotSizes(slot, false, { highDensityScale: 0.5 })
    const srcset = parseSrcset(ladderSrcset((width, h) => $img('/hero.jpg', { width, height: h }), source.width, source.height))
    // Drawn about 1120px wide on a 390px phone (672px tall, 5:3).
    const phone = pickCandidate(srcset, sizesWidth(sizes, 390, 2), 2).width / slot(390)
    const desktop = pickCandidate(srcset, sizesWidth(sizes, 1920, 1), 1).width / slot(1920)

    expect(phone).toBeGreaterThanOrEqual(1)
    expect(phone).toBeLessThan(1.4)
    expect(desktop).toBeGreaterThanOrEqual(1)
  })
})

describe('image delivery baseline', () => {
  const container = { maxWidth: 1536, padding: { default: 16, md: 20, lg: 32 } }
  const contained = containerSlot(viewportSlot, container)
  const slots = {
    full: viewportSlot,
    container: contained,
    split: wrapGridSlot(contained, container, { grid: { columns: { md: 2 }, gap: { md: 8 } } }),
    card: wrapGridSlot(contained, container, { grid: { columns: { md: 2, lg: 3 }, gap: { md: 8 } } }),
  }

  it('delivers each layout', () => {
    expect(Object.fromEntries(Object.entries(slots).map(([name, slot]) =>
      [name, sweep(imageSlotSizes(slot), LAYOUTS[name]!)]))).toMatchInlineSnapshot(`
        {
          "card": "under 1.00, over 1.38",
          "container": "under 1.00, over 1.34",
          "full": "under 0.96, over 1.25",
          "split": "under 1.00, over 1.38",
        }
      `)
  })

  it('delivers a full-bleed cover panorama in a break-height box, cropped to the box', () => {
    const height = { min: 320, vw: 40, max: 640 }
    const source = { width: 4000, height: 772 }
    const boxHeight = (viewport: number) => Math.min(height.max, Math.max(height.min, 0.4 * viewport))
    const sources = coverCropSources(viewportSlot, height, source.width, source.height, (width, cropHeight) =>
      $img('/photo.jpg', { width, height: cropHeight, fit: 'cover' }))
    let under = 1
    let over = 1

    for (const viewport of VIEWPORTS) {
      const crop = sources.find(candidate => mediaMatches(candidate.media, viewport))

      for (const dpr of DPRS) {
        // Either image is drawn object-cover: at least the box width, or the
        // box height times its own shape (the crop's, read from its URL).
        const candidates = crop ? parseSrcset(crop.srcset) : []
        const [, cropWidth, cropHeight] = /s_(\d+)x(\d+)/.exec(candidates.at(-1)?.url ?? '') ?? []
        const aspect = crop ? Number(cropWidth) / Number(cropHeight) : source.width / source.height
        const shown = Math.max(viewport, boxHeight(viewport) * aspect)
        // A crop can be no wider than the source's height allows at its shape.
        const available = crop ? candidates.at(-1)!.width : source.width
        const needed = Math.min(available, Math.ceil(shown * Math.min(dpr, 2)))
        const delivered = crop
          ? pickCandidate(parseSrcset(crop.srcset), sizesWidth(crop.sizes, viewport), dpr).width
          : deliveredAt(imageSlotSizes(coverSlot(viewportSlot, height, source.width, source.height)), source, viewport, dpr)
        const ratio = Math.min(delivered, source.width) / needed

        under = Math.min(under, ratio)
        over = Math.max(over, ratio)
      }
    }

    expect(`under ${under.toFixed(2)}, over ${over.toFixed(2)}`).toMatchInlineSnapshot('"under 1.00, over 1.35"')
  })
})
