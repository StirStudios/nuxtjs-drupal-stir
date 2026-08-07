import { ELEMENT_NODE, parse, renderSync, walkSync } from 'ultrahtml'
import type { ElementNode, Node } from 'ultrahtml'
import { versionImageSource } from './imageDelivery'

export interface RichTextImageResolution {
  sizes?: string
  src?: string
  srcset?: string
}

export interface RichTextImageContext {
  alignment?: 'center' | 'left' | 'right'
  containerClass?: string
  structured: boolean
}

export interface RichTextImageEnhancement {
  baseClass?: string
  roundedClass?: string
}

export type RichTextImageResolver = (
  source: string,
  width?: number,
  height?: number,
  context?: RichTextImageContext,
) => RichTextImageResolution

/**
 * Normalizes markup that Drupal has already filtered.
 * Never use this boundary for browser, user, or third-party HTML.
 */
export function trustedDrupalHtml(html?: string | null): string {
  return html ?? ''
}

function isElement(node: Node): node is ElementNode {
  return node.type === ELEMENT_NODE
}

function attribute(element: ElementNode | undefined, name: string): string | undefined {
  return element?.attributes[name]
}

function numberAttribute(element: ElementNode, name: string): number | undefined {
  const value = Number(attribute(element, name))

  return Number.isFinite(value) && value > 0 ? value : undefined
}

function removeAttribute(element: ElementNode, name: string): void {
  Reflect.deleteProperty(element.attributes, name)
}

function setAttribute(element: ElementNode, name: string, value: string): void {
  element.attributes[name] = value
}

function mergeClassAttribute(element: ElementNode, additions: string[]): void {
  const classes = new Set([
    ...(attribute(element, 'class') || '').split(/\s+/),
    ...additions.flatMap(value => value.split(/\s+/)),
  ].filter(Boolean))

  if (classes.size > 0) {
    setAttribute(element, 'class', [...classes].join(' '))
  }
}

function hasUnprefixedRoundedClass(element: ElementNode): boolean {
  return (attribute(element, 'class') || '')
    .split(/\s+/)
    .some(value => !value.includes(':') && /^rounded(?:-|$)/.test(value))
}

function ancestor(
  element: ElementNode,
  tagName: string,
): ElementNode | undefined {
  let parent: Node | undefined = element.parent

  while (parent) {
    if (isElement(parent) && parent.name === tagName) return parent
    parent = parent.parent
  }

  return undefined
}

/**
 * Enhances trusted Drupal rich-text images with the configured image provider.
 *
 * Stir Tools' semantic image hook identifies eligible images. Its structured
 * `<drupal-media>` wrapper supplies canonical delivery metadata.
 */
export function optimizeDrupalRichTextImages(
  html: string,
  resolve: RichTextImageResolver,
  enhancement: RichTextImageEnhancement = {},
): string {
  if (!html.includes('stir-rich-text-media-image')) {
    return html
  }

  const fragment = parse(html)

  walkSync(fragment, (node) => {
    if (!isElement(node) || node.name !== 'img') return
    const element = node

    const media = ancestor(element, 'drupal-media')
    const container = ancestor(element, 'div')
    const imageClasses = (attribute(element, 'class') || '').split(/\s+/)
    const isStructuredImage = imageClasses.includes('stir-rich-text-media-image')

    if (isStructuredImage) {
      mergeClassAttribute(element, [
        enhancement.baseClass || '',
        hasUnprefixedRoundedClass(element) ? '' : enhancement.roundedClass || '',
      ])
    }

    const originalSource = attribute(media, 'data-original-src')

    if (!originalSource) return

    const revision = attribute(media, 'data-original-revision')
    const canonicalSource = versionImageSource(originalSource, revision)

    if (!canonicalSource) return

    const alignmentClass = attribute(media, 'class') || attribute(element, 'class') || ''
    const alignment = (['left', 'center', 'right'] as const).find(value =>
      alignmentClass.split(/\s+/).includes(`align-${value}`),
    )
    const resolved = resolve(
      canonicalSource,
      numberAttribute(element, 'width'),
      numberAttribute(element, 'height'),
      {
        alignment,
        containerClass: attribute(container, 'class'),
        structured: isStructuredImage,
      },
    )

    if (!resolved.src || !resolved.srcset) return

    for (const name of [
      'src',
      'srcset',
      'sizes',
    ]) {
      removeAttribute(element, name)
    }

    setAttribute(element, 'data-nuxt-img', '')
    setAttribute(element, 'src', resolved.src)
    setAttribute(element, 'srcset', resolved.srcset)

    if (resolved.sizes) setAttribute(element, 'sizes', resolved.sizes)
  })

  return renderSync(fragment)
}
