import type { ComputedRef, InjectionKey } from 'vue'

export const carouselImageDeliverySizesKey: InjectionKey<ComputedRef<string | undefined>> =
  Symbol('stirCarouselImageDeliverySizes')

export function resolveCarouselImageDeliverySizes(
  gridItems: string | undefined,
  fullProfile: string | undefined,
): string | undefined {
  const profile = fullProfile?.trim()

  if (!profile) return undefined

  const itemClasses = gridItems?.trim()

  if (!itemClasses) return profile

  const hasMultiItemWidth = /(?:^|:|\s)(?:basis|w)-(?:1\/[2-9]|[2-9]\/[3-9])(?:\s|$)/.test(
    itemClasses,
  )

  return hasMultiItemWidth ? undefined : profile
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
