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
  iconLinks?: GlobalSeoAttributes[]
  socialImage?: CmsSocialImageConfig
}

type ImageResolver = (
  source: string,
  modifiers: Record<string, number | string>,
) => string

const CMS_ICON_RELS = new Set(['apple-touch-icon', 'icon', 'manifest', 'mask-icon'])

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

function optimizeSocialImage(
  source: string,
  config: Required<Omit<CmsSocialImageConfig, 'version'>> & Pick<CmsSocialImageConfig, 'version'>,
  imageResolver: ImageResolver,
  publicOrigin: string,
): string {
  try {
    return absoluteUrl(
      imageResolver(withVersion(source, config.version), {
        format: config.format,
        height: config.height,
        quality: config.quality,
        width: config.width,
      }),
      publicOrigin,
    )
  }
  catch {
    return source
  }
}

export function prepareGlobalSeoAssets(
  response: GlobalSeoResponse,
  config: CmsGlobalSeoAssetConfig,
  imageResolver: ImageResolver,
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
  const iconLinks = Array.isArray(config.iconLinks) ? config.iconLinks : []
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
    link: [
      ...response.link.flatMap((attributes) => {
        if (iconLinks.length > 0 && CMS_ICON_RELS.has(attributes.rel || '')) return []
        if (!socialImage.enabled || attributes.rel !== 'image_src' || !attributes.href) {
          return [attributes]
        }

        return [{ ...attributes, href: optimize(attributes.href) }]
      }),
      ...iconLinks,
    ],
  }
}
