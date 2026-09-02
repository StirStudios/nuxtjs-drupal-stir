import type { GlobalSeoAttributes, GlobalSeoResponse } from '../../shared/types/globalSeo'

export type CmsSocialImageConfig = {
  enabled?: boolean
  format?: string
  height?: number
  quality?: number
  version?: string
  width?: number
}

export type CmsGlobalSeoAssetConfig = {
  enabled?: boolean
  socialImage?: CmsSocialImageConfig
}

export type SeoImageResolver = (
  source: string,
  modifiers: Record<string, number | string>,
) => string

function withVersion(source: string, version?: string): string {
  const revision = version?.trim()

  if (!revision) return source

  const url = new URL(source)

  if (!url.searchParams.has('v')) url.searchParams.set('v', revision)

  return url.href
}

function absoluteUrl(value: string, publicOrigin: string): string {
  return new URL(value, `${publicOrigin.replace(/\/$/, '')}/`).href
}

function isSocialImageMeta(attributes: GlobalSeoAttributes): boolean {
  return attributes.property === 'og:image' || attributes.name === 'twitter:image'
}

function socialImageMimeType(format: string): string {
  const normalized = format.toLowerCase() === 'jpg' ? 'jpeg' : format.toLowerCase()

  return `image/${normalized}`
}

function withSocialImageFacts(
  meta: GlobalSeoAttributes[],
  config: Required<Omit<CmsSocialImageConfig, 'version'>> & Pick<CmsSocialImageConfig, 'version'>,
): GlobalSeoAttributes[] {
  if (!meta.some(attributes => attributes.property === 'og:image' && attributes.content)) {
    return meta
  }

  const facts = new Map([
    ['og:image:type', socialImageMimeType(config.format)],
    ['og:image:width', String(config.width)],
    ['og:image:height', String(config.height)],
  ])
  const seen = new Set<string>()
  const normalized = meta.map((attributes) => {
    const property = attributes.property

    if (!property || !facts.has(property)) return attributes

    seen.add(property)
    return { ...attributes, content: facts.get(property) as string }
  })

  for (const [property, content] of facts) {
    if (!seen.has(property)) normalized.push({ property, content })
  }

  return normalized
}

function optimizeImage(
  source: string,
  modifiers: Record<string, number | string>,
  imageResolver: SeoImageResolver,
  publicOrigin: string,
): string {
  try {
    return absoluteUrl(imageResolver(source, modifiers), publicOrigin)
  }
  catch {
    return source
  }
}

function optimizeSocialImage(
  source: string,
  config: Required<Omit<CmsSocialImageConfig, 'version'>> & Pick<CmsSocialImageConfig, 'version'>,
  imageResolver: SeoImageResolver,
  publicOrigin: string,
): string {
  try {
    return optimizeImage(withVersion(source, config.version), {
      format: config.format,
      height: config.height,
      quality: config.quality,
      width: config.width,
    }, imageResolver, publicOrigin)
  }
  catch {
    return source
  }
}

export function prepareGlobalSeoAssets(
  response: GlobalSeoResponse,
  config: CmsGlobalSeoAssetConfig,
  imageResolver: SeoImageResolver,
  publicOrigin: string,
  drupalOrigin = '',
): GlobalSeoResponse {
  const resolvedResponse = {
    ...response,
    link: response.link.map((attributes) => {
      const href = attributes.href
      const isDrupalFile = typeof href === 'string'
        && href.startsWith('/sites/default/files/')
        && Boolean(drupalOrigin)

      return isDrupalFile
        ? { ...attributes, href: absoluteUrl(href, drupalOrigin) }
        : attributes
    }),
  }

  if (config.enabled === false) return resolvedResponse

  const socialImage = {
    enabled: config.socialImage?.enabled === true,
    format: config.socialImage?.format || 'jpeg',
    height: config.socialImage?.height || 630,
    quality: config.socialImage?.quality || 90,
    version: config.socialImage?.version,
    width: config.socialImage?.width || 1200,
  }
  const optimize = (source: string) => optimizeSocialImage(
    source,
    socialImage,
    imageResolver,
    publicOrigin,
  )

  const meta = resolvedResponse.meta.map((attributes) => {
    if (!socialImage.enabled || !isSocialImageMeta(attributes) || !attributes.content) {
      return attributes
    }

    return { ...attributes, content: optimize(attributes.content) }
  })

  return {
    ...response,
    meta: socialImage.enabled ? withSocialImageFacts(meta, socialImage) : meta,
    link: resolvedResponse.link.flatMap((attributes) => {
      if (!socialImage.enabled || attributes.rel !== 'image_src' || !attributes.href) {
        return [attributes]
      }

      return [{ ...attributes, href: optimize(attributes.href) }]
    }),
  }
}
