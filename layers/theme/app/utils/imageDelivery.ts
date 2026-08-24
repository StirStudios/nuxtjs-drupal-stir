import type { ComputedRef, InjectionKey } from 'vue'

export const carouselImageDeliverySizesKey: InjectionKey<ComputedRef<string | undefined>> =
  Symbol('stirCarouselImageDeliverySizes')
export const carouselNestedImageDeliveryProfileKey: InjectionKey<ComputedRef<string | undefined>> =
  Symbol('stirCarouselNestedImageDeliveryProfile')
export const layoutImageDeliveryProfileKey: InjectionKey<ComputedRef<string | undefined>> =
  Symbol('stirLayoutImageDeliveryProfile')

export function resolveLayoutImageDeliveryProfile(
  layout: string | undefined,
  gridClass: string | undefined,
): string | undefined {
  const values = `${layout || ''} ${gridClass || ''}`
  const columns = [...values.matchAll(
    /(?:^|[:\s])(?:grid-cols-|grid_col_|col_?)(\d+)(?:\s|$)/g,
  )]
    .map(match => Number(match[1]))
    .filter(Number.isFinite)
  const maximumColumns = columns.length > 0 ? Math.max(...columns) : 0

  if (maximumColumns >= 3) return 'card'
  if (maximumColumns === 2 || layout?.startsWith('two_column')) return 'split'
  if (layout === 'grid') return 'card'
  if (/(?:^|\s)(?:\w+:)*max-w-(?:xs|sm|md|lg|xl|[2-7]xl)(?:\s|$)/.test(values)) {
    return 'split'
  }

  return undefined
}

export function resolveMediaGalleryDeliveryProfile(
  gridItems: string | undefined,
  itemCount: number,
  laneCount?: number,
): string | undefined {
  if (itemCount <= 1) return undefined

  if (laneCount !== undefined) {
    if (laneCount >= 3) return 'card'
    if (laneCount === 2) return 'split'
    return 'container'
  }

  const columns = [...(gridItems || '').matchAll(
    /(?:^|[:\s])(?:grid-cols-|grid_col_|col_?)(\d+)(?:\s|$)/g,
  )]
    .map(match => Number(match[1]))
    .filter(Number.isFinite)
  const maximumColumns = columns.length > 0 ? Math.max(...columns) : 0

  if (maximumColumns >= 3) return 'card'
  if (maximumColumns === 2) return 'split'
  if (maximumColumns === 1) return 'container'

  return itemCount >= 3 ? 'card' : 'split'
}

export function resolveStableMediaDeliveryProfile(
  gridItems: string | undefined,
  isMasonry: boolean,
): string {
  if (isMasonry || !gridItems?.trim()) return 'container'

  return resolveMediaGalleryDeliveryProfile(gridItems, 2) || 'container'
}

export function resolveCarouselImageDeliverySizes(
  gridItems: string | undefined,
  fullProfile: string | undefined,
): string | undefined {
  const profile = fullProfile?.trim()

  if (!profile) return undefined

  const itemClasses = gridItems?.trim()

  if (!itemClasses) return profile

  const responsiveWidths = [...itemClasses.matchAll(
    /(?:^|\s)(?:(sm|md|lg|xl|2xl):)?(?:basis|w)-(\d+)\/(\d+)(?=\s|$)/g,
  )].map(([, breakpoint, numerator, denominator]) => {
    const width = Math.round(Number(numerator) / Number(denominator) * 100)

    return `${breakpoint || 'sm'}:${width}vw`
  })

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
