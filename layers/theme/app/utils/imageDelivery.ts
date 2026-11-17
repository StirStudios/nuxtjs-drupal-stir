import type { ComputedRef, InjectionKey } from 'vue'
import type { GridBreakpoint, GridConfig } from './gridClasses'
import { GRID_BREAKPOINTS, WIDTH_MAX_WIDTH_CLASSES } from './gridClasses'

export const viewportImageLoadingKey: InjectionKey<boolean> =
  Symbol('stirViewportImageLoading')

// Provided by a lead carousel: the first image to claim it is the likely LCP.
export const leadImageKey: InjectionKey<() => boolean> = Symbol('stirLeadImage')

// Set by Paragraph/Hero when it renders as a section hero, for its media's classes.
export const sectionHeroMediaKey: InjectionKey<ComputedRef<boolean>> =
  Symbol('stirSectionHeroMedia')

export function versionImageSource(
  source: string | undefined,
  revision: string | undefined,
): string | undefined {
  const value = source?.trim()
  const version = revision?.trim()

  if (!value || !version) return value || undefined

  const hashIndex = value.indexOf('#')
  const hash = hashIndex >= 0 ? value.slice(hashIndex) : ''
  const sourceWithoutHash = hashIndex >= 0 ? value.slice(0, hashIndex) : value
  const queryIndex = sourceWithoutHash.indexOf('?')
  const path = queryIndex >= 0
    ? sourceWithoutHash.slice(0, queryIndex)
    : sourceWithoutHash
  const query = queryIndex >= 0
    ? sourceWithoutHash.slice(queryIndex + 1)
    : ''
  const params = new URLSearchParams(query)

  params.set('v', version)

  return `${path}?${params.toString()}${hash}`
}

// The media modal's frame: at most 72rem wide, a 1rem gutter each side, and
// no taller than 80% of the viewport. MediaModal builds its CSS from this.
export const MODAL_FRAME = { maxWidthPx: 1152, gutterPx: 32, maxHeightShare: 0.8 }

export function mediaAspectRatio(width: unknown, height: unknown): number {
  const w = Number(width)
  const h = Number(height)

  return Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0 ? w / h : 16 / 9
}

// A modal image's width as shown: a portrait photo on a wide screen is held
// back by the height, not the width.
export function resolveModalImageSizes(
  aspectRatio: number,
  viewportWidth: number,
  viewportHeight: number,
): string {
  const shown = Math.min(
    MODAL_FRAME.maxWidthPx,
    viewportWidth - MODAL_FRAME.gutterPx,
    viewportHeight * MODAL_FRAME.maxHeightShare * aspectRatio,
  )

  return `${Math.ceil(shown)}px`
}

// Every srcset is built from one width ladder, capped at the source, so no
// two candidates are more than a third apart (a quarter above 1440px) and the
// CDN caches a fixed set of widths. `sizes` only tells the browser the slot.
// 3840 is IPX's maxOutputDimension.
export const IMAGE_WIDTH_LADDER = [320, 480, 640, 750, 828, 1080, 1200, 1440, 1920, 2400, 2880, 3360, 3840]

export function imageLadderWidths(sourceWidth: unknown): number[] {
  const source = Number(sourceWidth)
  const max = IMAGE_WIDTH_LADDER.at(-1)!

  if (!(source > 0)) return IMAGE_WIDTH_LADDER

  const cap = Math.min(Math.round(source), max)

  return [...IMAGE_WIDTH_LADDER.filter(width => width < cap), cap]
}

/** A width-descriptor srcset over the ladder; `url` builds one candidate. */
export function ladderSrcset(
  url: (width: number, height: number | undefined) => string,
  sourceWidth: unknown,
  sourceHeight: unknown,
): string {
  const width = Number(sourceWidth)
  const height = Number(sourceHeight)
  const ratio = width > 0 && height > 0 ? height / width : undefined

  return imageLadderWidths(sourceWidth)
    .map(candidate => `${url(candidate, ratio ? Math.round(candidate * ratio) : undefined)} ${candidate}w`)
    .join(', ')
}

/**
 * The width an image is shown at, in CSS px, for a viewport width. The page
 * provides the viewport; every container, width cap, grid or carousel narrows
 * the slot it receives and provides the result, so nesting composes.
 * `sizes` is generated from the slot (imageSlotSizes).
 */
export type ImageSlot = (viewport: number) => number

export const imageSlotKey: InjectionKey<ComputedRef<ImageSlot>> = Symbol('stirImageSlot')

export const viewportSlot: ImageSlot = viewport => viewport

// Tailwind's breakpoints, as the grid uses them (GRID_BREAKPOINTS).
const BREAKPOINT_PX: Record<GridBreakpoint, number> = {
  default: 0, xs: 480, sm: 640, md: 768, lg: 1024, xl: 1280, '2xl': 1536,
}

type Responsive<T> = Partial<Record<GridBreakpoint, T>>

/** The value set for the widest breakpoint at or below a viewport, as Tailwind cascades. */
function responsive<T>(values: Responsive<T> | undefined, viewport: number): T | undefined {
  let value: T | undefined

  for (const breakpoint of GRID_BREAKPOINTS) {
    if (viewport >= BREAKPOINT_PX[breakpoint] && values?.[breakpoint] !== undefined) {
      value = values[breakpoint]
    }
  }

  return value
}

/** The theme container's size, matching its classes (stirTheme.container). */
export interface ImageContainer {
  maxWidth: number
  padding: Responsive<number>
}

/** A `mx-auto max-w-* px-*` container inside the parent slot. */
export function containerSlot(parent: ImageSlot, container: ImageContainer): ImageSlot {
  return viewport => Math.min(parent(viewport), container.maxWidth)
    - 2 * (responsive(container.padding, viewport) ?? 0)
}

// Tailwind's container scale, in px, for the Width field's max-w classes.
const MAX_WIDTH_PX: Record<string, number> = {
  xs: 320, sm: 384, md: 448, lg: 512, xl: 576, '2xl': 672,
  '3xl': 768, '4xl': 896, '5xl': 1024, '6xl': 1152, '7xl': 1280,
}

/** A paragraph's Width field (WIDTH_MAX_WIDTH_CLASSES) caps the slot from its breakpoint. */
export function widthSlot(parent: ImageSlot, width: string | undefined): ImageSlot {
  const match = /^(?:(\w+):)?max-w-(\w+)$/.exec((width && WIDTH_MAX_WIDTH_CLASSES[width]) || '')
  const cap = match ? MAX_WIDTH_PX[match[2]!] : undefined

  if (!match || !cap) return parent

  const from = match[1] ? BREAKPOINT_PX[match[1] as GridBreakpoint] ?? 0 : 0

  return viewport => viewport >= from ? Math.min(parent(viewport), cap) : parent(viewport)
}

/**
 * One cell of a grid inside the parent slot: columns and gaps follow the
 * structured GridConfig (Tailwind gap steps are 4px). A fixed-ratio template
 * such as "[8fr_4fr]" gives each region its share; `region` picks the column,
 * defaulting to the widest. `span` is true for regions spanning every column.
 */
export function gridSlot(
  parent: ImageSlot,
  grid: GridConfig | undefined,
  options: { region?: number, span?: boolean } = {},
): ImageSlot {
  if (!grid?.columns || options.span) return parent

  return (viewport) => {
    const width = parent(viewport)
    const columns = responsive(grid.columns, viewport) ?? 1
    const gap = 4 * (responsive(grid.gap, viewport) ?? 0)
    const shares = typeof columns === 'string'
      ? [...columns.matchAll(/(\d+(?:\.\d+)?)fr/g)].map(match => Number(match[1]))
      : Array.from({ length: Math.max(1, Number(columns) || 1) }, () => 1)
    const total = shares.reduce((sum, share) => sum + share, 0)

    if (shares.length === 0 || total === 0) return width

    const share = options.region === undefined
      ? Math.max(...shares)
      : shares[options.region % shares.length]!

    return ((width - gap * (shares.length - 1)) * share) / total
  }
}

/**
 * A WrapGrid's cell inside the parent slot, in WrapGrid's own order: the
 * theme container, then the Width field's cap, then the grid. Without a
 * parent slot, content sits in the theme container.
 */
export function wrapGridSlot(
  parent: ImageSlot | undefined,
  themeContainer: ImageContainer,
  options: {
    container?: boolean
    width?: string
    grid?: GridConfig
    region?: number
    span?: boolean
  },
): ImageSlot {
  const outer = parent ?? containerSlot(viewportSlot, themeContainer)
  const contained = options.container ? containerSlot(outer, themeContainer) : outer

  return gridSlot(widthSlot(contained, options.width), options.grid, options)
}

// A box height as CSS clamp(min, vw, max) in px, optionally capped at a share
// of the small viewport height (svh).
export interface CoverHeight { min: number, vw: number, max: number, maxSvh?: number }

/** The CSS length for a cover height, as its media.heights class writes it. */
export function coverHeightCss({ min, vw, max, maxSvh }: CoverHeight): string {
  const clamp = `clamp(${min / 16}rem,${vw}vw,${max / 16}rem)`

  return maxSvh ? `min(${clamp},${maxSvh}svh)` : clamp
}

/**
 * An object-cover image in a box of fixed height is shown at the box height
 * times its aspect ratio when it is wider than the box, never past the source
 * width (IPX does not enlarge). An svh cap is left out, so a short viewport
 * still gets enough pixels.
 */
export function coverSlot(
  parent: ImageSlot,
  height: CoverHeight,
  sourceWidth: unknown,
  sourceHeight: unknown,
): ImageSlot {
  const aspectRatio = mediaAspectRatio(sourceWidth, sourceHeight)
  const maxWidth = Number(sourceWidth) > 0 ? Number(sourceWidth) : Infinity

  return (viewport) => {
    const boxHeight = Math.min(height.max, Math.max(height.min, (height.vw / 100) * viewport))

    return Math.max(parent(viewport), Math.min(maxWidth, boxHeight * aspectRatio))
  }
}

const SIZES_BANDS = GRID_BREAKPOINTS.map(breakpoint => BREAKPOINT_PX[breakpoint])
const WIDEST_VIEWPORT = 2560

function sizesLength(slot: ImageSlot, from: number, to: number): string {
  const start = slot(from)
  const end = slot(to)
  const scale = (end - start) / (to - from)
  const offset = start - scale * from
  const linear = [0.25, 0.5, 0.75].every((step) => {
    const viewport = from + (to - from) * step

    return Math.abs(slot(viewport) - (scale * viewport + offset)) < 1
  })

  if (!linear || Math.abs(scale) < 0.001) return `${Math.ceil(Math.max(start, end))}px`

  const vw = Math.round(scale * 1000) / 10
  const px = Math.round(offset)

  if (px === 0) return `${vw}vw`

  return `calc(${vw}vw ${px < 0 ? '-' : '+'} ${Math.abs(px)}px)`
}

/**
 * `sizes` for a slot: one entry per breakpoint band, exact where the slot is
 * linear in the band (calc of vw and px), else the band's widest width. Lazy
 * images lead with `auto`, so browsers that support it use the laid-out width.
 */
export function imageSlotSizes(slot: ImageSlot, lazy = false): string {
  const entries: Array<{ to?: number, length: string }> = []

  SIZES_BANDS.forEach((from, index) => {
    const next = SIZES_BANDS[index + 1]
    const length = sizesLength(slot, Math.max(from, 320), next ? next - 1 : WIDEST_VIEWPORT)
    const previous = entries.at(-1)

    if (previous?.length === length) previous.to = next ? next - 1 : undefined
    else entries.push({ to: next ? next - 1 : undefined, length })
  })

  const sizes = entries
    .map(({ to, length }) => to === undefined ? length : `(max-width: ${to}px) ${length}`)
    .join(', ')

  return lazy ? `auto, ${sizes}` : sizes
}

export interface CoverCropSource { media: string, sizes: string, srcset: string }

/**
 * Art-direction sources for an object-cover image in a fixed-height box: in
 * each breakpoint band where the image is wider than the box, a centre crop to
 * the box's widest shape in that band, so a phone downloads the slice it shows
 * rather than the whole panorama. `box` is the box's width (the slot before
 * coverSlot); `url` builds one cropped candidate. Bands without a crop fall
 * through to the <img>.
 */
export function coverCropSources(
  box: ImageSlot,
  height: CoverHeight,
  sourceWidth: unknown,
  sourceHeight: unknown,
  url: (width: number, height: number) => string,
): CoverCropSource[] {
  const width = Number(sourceWidth)
  const sourceHeightPx = Number(sourceHeight)

  if (!(width > 0) || !(sourceHeightPx > 0)) return []

  const sources: CoverCropSource[] = []

  SIZES_BANDS.forEach((from, index) => {
    const next = SIZES_BANDS[index + 1]
    const to = next ? next - 1 : WIDEST_VIEWPORT
    const boxHeightAt = (viewport: number) =>
      Math.min(height.max, Math.max(height.min, (height.vw / 100) * viewport))
    // The crop must be as wide as the box's widest shape anywhere in the band.
    const aspect = Math.max(...[Math.max(from, 320), to].map(viewport => box(viewport) / boxHeightAt(viewport)))

    if (width / sourceHeightPx <= aspect * 1.05) return

    const cropWidth = Math.min(width, Math.round(sourceHeightPx * aspect))
    const media = [
      index > 0 ? `(min-width: ${from}px)` : '',
      next ? `(max-width: ${to}px)` : '',
    ].filter(Boolean).join(' and ')

    sources.push({
      media,
      // Cut to the band's widest box shape, the crop is drawn at the box
      // height times that shape wherever the box is narrower.
      sizes: sizesLength(viewport => Math.max(box(viewport), boxHeightAt(viewport) * aspect), Math.max(from, 320), to),
      srcset: imageLadderWidths(cropWidth)
        .map(candidate => `${url(candidate, Math.round(candidate / aspect))} ${candidate}w`)
        .join(', '),
    })
  })

  return sources
}
