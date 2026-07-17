export function resolveImageCdnBase(value: string | undefined): string | undefined {
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
