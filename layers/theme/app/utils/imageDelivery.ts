import type { ComputedRef, InjectionKey } from 'vue'
import type { GridConfig } from './gridClasses'
import { GRID_BREAKPOINTS, maxGridColumns } from './gridClasses'

export const viewportImageLoadingKey: InjectionKey<boolean> =
  Symbol('stirViewportImageLoading')

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
