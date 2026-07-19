import { versionImageSource } from './imageDelivery'

export interface RichTextImageResolution {
  sizes?: string
  src?: string
  srcset?: string
}

export type RichTextImageResolver = (
  source: string,
  width?: number,
  height?: number,
) => RichTextImageResolution

/**
 * Normalizes markup that Drupal has already filtered.
 * Never use this boundary for browser, user, or third-party HTML.
 */
export function trustedDrupalHtml(html?: string | null): string {
  return html ?? ''
}

function attribute(tag: string, name: string): string | undefined {
  const match = tag.match(new RegExp(`\\s${name}=(?:"([^"]*)"|'([^']*)')`, 'i'))

  return match?.[1] ?? match?.[2]
}

function numberAttribute(tag: string, name: string): number | undefined {
  const value = Number(attribute(tag, name))

  return Number.isFinite(value) && value > 0 ? value : undefined
}

function escapeAttribute(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
}

function removeAttribute(tag: string, name: string): string {
  return tag.replace(
    new RegExp(`\\s${name}=(?:"[^"]*"|'[^']*')`, 'gi'),
    '',
  )
}

function setAttribute(tag: string, name: string, value: string): string {
  const withoutAttribute = removeAttribute(tag, name)

  return withoutAttribute.replace(/\s*\/?>(?=\s*$)/, ` ${name}="${escapeAttribute(value)}">`)
}

/**
 * Enhances trusted Drupal rich-text images with the configured image provider.
 *
 * Structured `<drupal-media>` metadata is preferred. Legacy `originalsrc`
 * attributes remain supported during the fleet migration.
 */
export function optimizeDrupalRichTextImages(
  html: string,
  resolve: RichTextImageResolver,
): string {
  return html.replace(/<img\b[^>]*>/gi, (tag, offset, sourceHtml: string) => {
    const enclosingStart = sourceHtml.lastIndexOf('<drupal-media', offset)
    const enclosingEnd = sourceHtml.lastIndexOf('</drupal-media>', offset)
    const mediaTag = enclosingStart > enclosingEnd
      ? sourceHtml.slice(enclosingStart, sourceHtml.indexOf('>', enclosingStart) + 1)
      : ''
    const originalSource = attribute(mediaTag, 'data-original-src')
      || attribute(tag, 'data-original-src')
      || attribute(tag, 'originalsrc')

    if (!originalSource) return tag

    const revision = attribute(mediaTag, 'data-original-revision')
      || attribute(tag, 'data-original-revision')
      || attribute(tag, 'originalrevision')
    const canonicalSource = versionImageSource(
      originalSource.replaceAll('&amp;', '&'),
      revision,
    )

    if (!canonicalSource) return tag

    const resolved = resolve(
      canonicalSource,
      numberAttribute(tag, 'width'),
      numberAttribute(tag, 'height'),
    )

    if (!resolved.src || !resolved.srcset) return tag

    let optimized = tag

    for (const name of [
      'src',
      'srcset',
      'sizes',
      'originalsrc',
      'originalrevision',
      'data-original-src',
      'data-original-revision',
    ]) {
      optimized = removeAttribute(optimized, name)
    }

    optimized = setAttribute(optimized, 'data-nuxt-img', '')
    optimized = setAttribute(optimized, 'src', resolved.src)
    optimized = setAttribute(optimized, 'srcset', resolved.srcset)

    if (resolved.sizes) {
      optimized = setAttribute(optimized, 'sizes', resolved.sizes)
    }

    return optimized
  })
}
