import type { ComputedRef, InjectionKey, VNode } from 'vue'
import type { GridConfig } from './gridClasses'
import { GRID_BREAKPOINTS, maxGridColumns } from './gridClasses'

export const viewportImageLoadingKey: InjectionKey<boolean> =
  Symbol('stirViewportImageLoading')

// Provided by a lead carousel: the first image to claim it is the likely LCP.
export const leadImageKey: InjectionKey<() => boolean> = Symbol('stirLeadImage')

// Set by Paragraph/Hero when it renders as a section hero; media sizes itself as the section background.
export const sectionHeroMediaKey: InjectionKey<ComputedRef<boolean>> =
  Symbol('stirSectionHeroMedia')

// The uuids of paragraphs that span the viewport edge to edge: a default page's
// top-level paragraphs, and the children of an uncontained single-column
// Layout that is itself edge to edge. Matching by uuid keeps the signal from
// reaching paragraphs nested inside others (accordions, tabs, cards).
export const fullBleedParagraphsKey: InjectionKey<ComputedRef<ReadonlySet<string>>> =
  Symbol('stirFullBleedParagraphs')

export function paragraphUuids(nodes: VNode[]): Set<string> {
  return new Set(nodes
    .map(node => node.props?.uuid)
    .filter((uuid): uuid is string => typeof uuid === 'string' && uuid !== ''))
}

export const carouselImageDeliverySizesKey: InjectionKey<ComputedRef<string | undefined>> =
  Symbol('stirCarouselImageDeliverySizes')
export const layoutImageDeliveryProfileKey: InjectionKey<ComputedRef<string | undefined>> =
  Symbol('stirLayoutImageDeliveryProfile')

export function resolveLayoutImageDeliveryProfile(
  layout: string | undefined,
  gridClass: string | undefined,
  contained = true,
): string | undefined {
  const values = `${layout || ''} ${gridClass || ''}`
  const columns = [...values.matchAll(
    /(?:^|[:\s])(?:grid-cols-|grid_col_|col_?)(\d+)(?:\s|$)/g,
  )]
    .map(match => Number(match[1]))
    .filter(Number.isFinite)
  const maximumColumns = columns.length > 0 ? Math.max(...columns) : 0

  if (maximumColumns >= 3) return 'card'
  if (maximumColumns === 2 || layout?.startsWith('two_column')) {
    return contained ? 'split' : 'splitFull'
  }
  if (layout === 'grid') return 'card'
  if (/(?:^|\s)(?:\w+:)*max-w-(?:xs|sm|md|lg|xl|[2-7]xl)(?:\s|$)/.test(values)) {
    return 'split'
  }

  return undefined
}

/**
 * Resolves an image delivery profile from a grid-mode paragraph's own
 * layout key and structured column config (e.g. the Layout paragraph's
 * `grid_class`, or a View's `grid_items`). See
 * resolveLayoutImageDeliveryProfile() for the rich-text-HTML equivalent,
 * which still parses author-entered container classes, not Drupal's
 * structured contract.
 */
export function resolveGridImageDeliveryProfile(
  grid: GridConfig | undefined,
  layoutKey: string | undefined,
  width: string | undefined,
  contained = true,
): string | undefined {
  const maxColumns = maxGridColumns(grid)

  if (maxColumns >= 3) return 'card'
  if (layoutKey === 'two_column_8_4' || layoutKey === 'two_column_4_8') {
    return contained ? 'splitWide' : 'splitWideFull'
  }
  if (maxColumns === 2 || layoutKey?.startsWith('two_column')) {
    return contained ? 'split' : 'splitFull'
  }
  if (layoutKey === 'grid') return 'card'
  if (width) return 'split'

  return undefined
}

export function resolveMediaGalleryDeliveryProfile(
  gridItems: GridConfig | undefined,
  itemCount: number,
  laneCount?: number,
): string | undefined {
  if (itemCount <= 1) return undefined

  if (laneCount !== undefined) {
    if (laneCount >= 3) return 'card'
    if (laneCount === 2) return 'split'
    return 'container'
  }

  const maximumColumns = maxGridColumns(gridItems)

  if (maximumColumns >= 3) return 'card'
  if (maximumColumns === 2) return 'split'
  if (maximumColumns === 1) return 'container'

  return itemCount >= 3 ? 'card' : 'split'
}

export function resolveStableMediaDeliveryProfile(
  gridItems: GridConfig | undefined,
  isMasonry: boolean,
): string {
  if (isMasonry || !gridItems?.columns || Object.keys(gridItems.columns).length === 0) {
    return 'container'
  }

  return resolveMediaGalleryDeliveryProfile(gridItems, 2) || 'container'
}

export function resolveCarouselImageDeliverySizes(
  gridItems: GridConfig | undefined,
  fullProfile: string | undefined,
): string | undefined {
  const profile = fullProfile?.trim()

  if (!profile) return undefined

  const columns = gridItems?.columns

  // A single (or no) full-width slide gets the plain full profile, matching
  // the default single-slide carousel with no per-breakpoint override.
  if (!columns || maxGridColumns(gridItems) <= 1) return profile

  const responsiveWidths: string[] = []

  for (const breakpoint of GRID_BREAKPOINTS) {
    const value = columns[breakpoint]

    if (typeof value !== 'number') continue

    const width = Math.round(100 / value)
    const label = breakpoint === 'default' ? 'sm' : breakpoint

    responsiveWidths.push(`${label}:${width}vw`)
  }

  return responsiveWidths.length > 0
    ? responsiveWidths.join(' ')
    : profile
}

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

export function resolveImageDeliveryProfile(
  deliveryProfile: string | undefined,
  isHero: boolean,
  profiles: Record<string, string>,
): string | undefined {
  const requestedKey = deliveryProfile?.trim()
  const key = isHero || requestedKey === 'auto'
    ? (isHero ? 'hero' : 'container')
    : requestedKey || 'container'

  if (!key) return undefined

  const profile = (profiles[key] || profiles.container)?.trim()

  return profile || undefined
}

// The media modal's frame: at most 72rem wide, a 1rem gutter each side, and
// no taller than 80% of the viewport. MediaModal builds its CSS from this.
export const MODAL_FRAME = { maxWidthPx: 1152, gutterPx: 32, maxHeightShare: 0.8 }

// The widths the modal profile (sm:100vw lg:1152px) already produces, so a
// modal asks for images the CDN has cached; each also comes at twice the width
// for high-density screens.
const MODAL_IMAGE_WIDTHS = [640, 768, 1152]

export function mediaAspectRatio(width: unknown, height: unknown): number {
  const w = Number(width)
  const h = Number(height)

  return Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0 ? w / h : 16 / 9
}

// A modal image's width as shown, snapped up to a cached width: a portrait
// photo on a wide screen is held back by the height, not the width.
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

  return `${MODAL_IMAGE_WIDTHS.find(width => width >= shown) ?? MODAL_FRAME.maxWidthPx}px`
}

const MIN_VIEWPORT_PX = 320

// A cover box height as CSS clamp(min, vw, max), in pixels.
export interface CoverHeight { min: number, vw: number, max: number }

const coverHeightAt = (height: CoverHeight, viewport: number) =>
  Math.min(height.max, Math.max(height.min, (height.vw / 100) * viewport))

/**
 * An object-cover image in a box of fixed height is shown at the box height
 * times its own aspect ratio when it is wider than the box, so a delivery
 * profile sized to the box width alone upscales it. Widens each profile entry
 * to the image's shown width, never past the source width (IPX does not
 * enlarge).
 *
 * @nuxt/image applies an entry from its own screen up to the next entry's
 * (the first from 0, the last with no upper bound) and builds its srcset
 * candidate at its own screen width. A cover image's width follows the box
 * height, so every entry but the last asks, in px, for the shown width at the
 * widest viewport of its band; the last stays fluid at its largest
 * shown-to-viewport ratio, at its own screen.
 */
export function resolveCoverImageSizes(
  sizes: string | undefined,
  height: CoverHeight | undefined,
  sourceWidth: unknown,
  sourceHeight: unknown,
  screens: Record<string, number>,
): string | undefined {
  if (!sizes || !height) return sizes

  const aspectRatio = mediaAspectRatio(sourceWidth, sourceHeight)
  const maxWidth = Number(sourceWidth) > 0 ? Number(sourceWidth) : Infinity
  const shownAt = (viewport: number) =>
    Math.min(maxWidth, coverHeightAt(height, viewport) * aspectRatio)

  const entries = sizes.trim().split(/\s+/).map((entry) => {
    const [key = '', size = ''] = entry.split(':')

    return { key, size, screen: screens[key] ?? Number.parseInt(key) }
  })

  if (entries.some(({ screen, size }) => !screen || !/^\d+(?:\.\d+)?(?:vw|px)$/.test(size))) {
    return sizes
  }

  entries.sort((a, b) => a.screen - b.screen)

  return entries.map(({ key, size, screen }, index) => {
    const amount = Number.parseFloat(size)
    const fluid = size.endsWith('vw')
    const last = index === entries.length - 1

    if (last && fluid) {
      const from = index === 0 ? MIN_VIEWPORT_PX : screen

      return `${key}:${Math.ceil(Math.max(amount, (shownAt(from) * 100) / from))}vw`
    }

    const widest = last ? Infinity : entries[index + 1]!.screen - 1
    const box = fluid ? (amount / 100) * widest : amount
    const shown = last ? Math.min(maxWidth, height.max * aspectRatio) : shownAt(widest)

    return shown > box ? `${key}:${Math.ceil(shown)}px` : `${key}:${size}`
  }).join(' ')
}
