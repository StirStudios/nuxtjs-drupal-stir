import {
  optimizeDrupalRichTextImages,
  trustedDrupalHtml,
} from '#stir/utils/trustedDrupalHtml'
import type { MaybeRefOrGetter } from 'vue'

type HtmlSource = string | null | undefined

/**
 * Applies the shared Nuxt Image/IPX policy to trusted Drupal rich text.
 */
export function useOptimizedDrupalHtml(source: MaybeRefOrGetter<HtmlSource>) {
  const appConfig = useAppConfig()
  const $img = useImage()
  const getSizes = $img.getSizes as unknown as (
    source: string,
    options: {
      modifiers: Record<string, number | string | undefined>
      sizes: string | undefined
    },
  ) => ReturnType<typeof $img.getSizes>

  return computed(() => {
    const html = trustedDrupalHtml(toValue(source))
    const image = appConfig.stirTheme.media.image

    return optimizeDrupalRichTextImages(html, (canonicalSource, width, height, context) =>
      getSizes(canonicalSource, {
        sizes:
          context?.alignment === 'left' || context?.alignment === 'right'
            ? image.profiles.split
            : image.profiles.container,
        modifiers: {
          format: image.format,
          height,
          quality: image.quality,
          width,
        },
      }),
    )
  })
}
