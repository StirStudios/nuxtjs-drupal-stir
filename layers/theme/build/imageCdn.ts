import createIpxProvider from '@nuxt/image/runtime/providers/ipx'

function extractRevision(source: string): {
  revision?: string
  source: string
} {
  const hashIndex = source.indexOf('#')
  const hash = hashIndex >= 0 ? source.slice(hashIndex) : ''
  const sourceWithoutHash = hashIndex >= 0 ? source.slice(0, hashIndex) : source
  const queryIndex = sourceWithoutHash.indexOf('?')

  if (queryIndex < 0) return { source }

  const path = sourceWithoutHash.slice(0, queryIndex)
  const params = new URLSearchParams(sourceWithoutHash.slice(queryIndex + 1))
  const revision = params.get('v')?.trim() || undefined

  if (!revision) return { source }

  params.delete('v')

  const query = params.toString()

  return {
    revision,
    source: `${path}${query ? `?${query}` : ''}${hash}`,
  }
}

export default () => {
  const provider = createIpxProvider()

  return {
    ...provider,
    getImage(
      source: Parameters<typeof provider.getImage>[0],
      options: Parameters<typeof provider.getImage>[1],
      context: Parameters<typeof provider.getImage>[2],
    ) {
      const normalized = extractRevision(source)
      const image = provider.getImage(normalized.source, options, context)

      if (!normalized.revision) return image

      const separator = image.url.includes('?') ? '&' : '?'

      return {
        ...image,
        url: `${image.url}${separator}v=${encodeURIComponent(normalized.revision)}`,
      }
    },
  }
}

export function resolveImageCdnBase(
  value: string | undefined,
  development = false,
): string | undefined {
  if (development) return undefined

  const candidate = value?.trim()

  if (!candidate) return undefined

  let url: URL

  try {
    url = new URL(candidate)
  } catch {
    throw new Error('NUXT_IMAGE_CDN must be an absolute HTTP(S) origin')
  }

  if (!['http:', 'https:'].includes(url.protocol)
    || url.username
    || url.password
    || url.pathname !== '/'
    || url.search
    || url.hash) {
    throw new Error('NUXT_IMAGE_CDN must be an absolute HTTP(S) origin')
  }

  return url.origin
}

export function resolveDrupalImageDomain(value: string | undefined): string | undefined {
  const candidate = value?.trim()

  if (!candidate) return undefined

  try {
    const url = new URL(candidate)

    return ['http:', 'https:'].includes(url.protocol) ? url.host : undefined
  } catch {
    return undefined
  }
}
