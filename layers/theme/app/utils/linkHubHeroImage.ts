export type LinkHubHeroImage = Record<string, unknown> & {
  src?: string
  originalSrc?: string
}

type DrupalElement = {
  element?: string
  props?: Record<string, unknown>
  slots?: Record<string, unknown>
}

export function resolveLinkHubHeroImage(value: unknown): LinkHubHeroImage | null {
  if (Array.isArray(value)) {
    for (const item of value) {
      const image = resolveLinkHubHeroImage(item)

      if (image) return image
    }

    return null
  }

  if (!value || typeof value !== 'object') return null

  const element = value as DrupalElement

  if (element.element === 'media-image') {
    const source = element.props?.originalSrc || element.props?.src

    return typeof source === 'string' && source.trim()
      ? element.props as LinkHubHeroImage
      : null
  }

  return element.slots
    ? resolveLinkHubHeroImage(Object.values(element.slots))
    : null
}
