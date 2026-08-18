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
  iconImage?: {
    enabled?: boolean
  }
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

function isIconLink(attributes: GlobalSeoAttributes): boolean {
  const rel = attributes.rel?.trim().toLowerCase() || ''

  return rel === 'apple-touch-icon' || rel.split(/\s+/).includes('icon')
}

function isIcoSource(source: string): boolean {
  try {
    return new URL(source, 'https://cms.invalid').pathname.toLowerCase().endsWith('.ico')
  }
  catch {
    return source.toLowerCase().split(/[?#]/, 1)[0]?.endsWith('.ico') === true
  }
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
  return optimizeImage(withVersion(source, config.version), {
    format: config.format,
    height: config.height,
    quality: config.quality,
    width: config.width,
  }, imageResolver, publicOrigin)
}

export function prepareGlobalSeoAssets(
  response: GlobalSeoResponse,
  config: CmsGlobalSeoAssetConfig,
  imageResolver: SeoImageResolver,
  publicOrigin: string,
): GlobalSeoResponse {
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

  return {
    ...response,
    meta: response.meta.map((attributes) => {
      if (!socialImage.enabled || !isSocialImageMeta(attributes) || !attributes.content) {
        return attributes
      }

      return { ...attributes, content: optimize(attributes.content) }
    }),
    link: response.link.flatMap((attributes) => {
      if (
        config.iconImage?.enabled === true &&
        isIconLink(attributes) &&
        attributes.href &&
        !isIcoSource(attributes.href)
      ) {
        return [{
          ...attributes,
          href: optimizeImage(attributes.href, {}, imageResolver, publicOrigin),
        }]
      }

      if (!socialImage.enabled || attributes.rel !== 'image_src' || !attributes.href) {
        return [attributes]
      }

      return [{ ...attributes, href: optimize(attributes.href) }]
    }),
  }
}
