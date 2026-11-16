import { describe, expect, it } from 'vitest'
import { createImage } from '@nuxt/image/runtime'
import { parseSrcset, pickCandidate, sizesWidth } from '../../scripts/perf/imageSelection.mjs'
import createStirIpxProvider from '../../layers/theme/build/imageCdn'
import { resolveCoverImageSizes } from '../../layers/theme/app/utils/imageDelivery'

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
})

// The layer's real delivery path: @nuxt/image's getSizes with the layer's
// provider, then a browser's pick, then IPX's output (it never enlarges).
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
  const image = $img.getSizes('/photo.jpg', {
    sizes,
    modifiers: { width: source.width, height: source.height, maxWidth: source.width },
  })
  const candidate = pickCandidate(parseSrcset(image.srcset), sizesWidth(image.sizes!, viewport), dpr)
  const requested = Number(/s_(\d+)x/.exec(candidate.url)?.[1] ?? candidate.width)

  return Math.min(requested, source.width)
}

// What each layout really shows, from the theme's container (96rem, px-4
// sm:px-6 lg:px-8) and a 2rem column gap.
const content = (viewport: number) =>
  Math.min(viewport, 1536) - (viewport >= 1024 ? 64 : viewport >= 640 ? 48 : 32)
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
describe('image delivery baseline', () => {
  const profiles = {
    full: 'sm:100vw md:100vw lg:100vw xl:100vw 2xl:100vw',
    container: 'sm:100vw md:100vw xl:1472px',
    split: 'sm:100vw md:50vw xl:736px',
    card: 'sm:100vw md:50vw lg:34vw xl:480px',
  }

  it('delivers each layout profile', () => {
    expect(Object.fromEntries(Object.entries(profiles).map(([name, sizes]) =>
      [name, sweep(sizes, LAYOUTS[name]!)]))).toMatchInlineSnapshot(`
        {
          "card": "under 1.00, over 1.37",
          "container": "under 1.00, over 2.22",
          "full": "under 0.77, over 2.00",
          "split": "under 1.00, over 1.79",
        }
      `)
  })

  it('delivers a full-bleed cover panorama in a break-height box', () => {
    const height = { min: 320, vw: 40, max: 640 }
    const source = { width: 4000, height: 772 }
    const sizes = resolveCoverImageSizes(profiles.full, height, source.width, source.height, screens)!
    const shown = (viewport: number) =>
      Math.max(viewport, Math.min(height.max, Math.max(height.min, 0.4 * viewport)) * (source.width / source.height))

    expect(sweep(sizes, shown, source)).toMatchInlineSnapshot('"under 1.00, over 1.28"')
  })
})
