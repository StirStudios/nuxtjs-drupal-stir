import type { ImageModifiers } from '@nuxt/image'
import {
  optimizeDrupalRichTextImages,
  trustedDrupalHtml,
} from '#stir/utils/trustedDrupalHtml'
import type { MaybeRefOrGetter } from 'vue'
import {
  containerSlot,
  imageSlotKey,
  imageSlotSizes,
  ladderSrcset,
  viewportSlot,
} from '#stir/utils/imageDelivery'

type HtmlSource = string | null | undefined

/**
 * Applies the shared Nuxt Image/IPX policy to trusted Drupal rich text. Images
 * take the slot of the paragraph they sit in; a floated image takes half of
 * it, and one inside an authored grid (`grid-cols-N` in the markup) one cell.
 */
export function useOptimizedDrupalHtml(source: MaybeRefOrGetter<HtmlSource>) {
  const appConfig = useAppConfig()
  const $img = useImage()
  const parentSlot = inject(imageSlotKey, undefined)

  return computed(() => {
    const html = trustedDrupalHtml(toValue(source))
    const image = appConfig.stirTheme.media.image
    const slot = parentSlot?.value ?? containerSlot(viewportSlot, image.container)

    return optimizeDrupalRichTextImages(
      html,
      (canonicalSource, width, height, context) => {
        const columns = Math.max(1, ...[...(context?.containerClass ?? '').matchAll(/grid-cols-(\d+)/g)]
          .map(match => Number(match[1])))
        const divisor = context?.alignment === 'left' || context?.alignment === 'right' ? 2 : columns
        // Typed against @nuxt/image: in sites its provider types resolve to
        // nothing and $img's modifiers parameter becomes `undefined`.
        const url = (candidateWidth: number, candidateHeight?: number) => $img(canonicalSource, {
          format: image.format,
          height: candidateHeight,
          quality: image.quality,
          width: candidateWidth,
        } satisfies Partial<ImageModifiers> as never)
        const fallbackWidth = Math.min(width || 1920, 1920)

        return {
          sizes: imageSlotSizes(viewport => slot(viewport) / divisor, context?.lazy),
          src: url(fallbackWidth, width && height ? Math.round((fallbackWidth * height) / width) : undefined),
          srcset: ladderSrcset(url, width, height),
        }
      },
      {
        baseClass: appConfig.stirTheme.media.base,
        roundedClass: appConfig.stirTheme.media.rounded,
      },
    )
  })
}
