export type StirImageDeliveryMode = 'drupal' | 'nuxt'

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
  responsiveStyle: string | undefined,
  isHero: boolean,
  profiles: Record<string, string>,
): string | undefined {
  const key = isHero ? 'hero' : responsiveStyle?.trim()

  if (!key) return undefined

  const profile = profiles[key]?.trim()

  return profile || undefined
}
