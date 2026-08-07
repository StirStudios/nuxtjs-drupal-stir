import {
  optimizeDrupalRichTextImages,
  trustedDrupalHtml,
} from '#stir/utils/trustedDrupalHtml'
import type { MaybeRefOrGetter } from 'vue'
import { resolveLayoutImageDeliveryProfile } from '#stir/utils/imageDelivery'

type HtmlSource = string | null | undefined

/**
 * Applies the shared Nuxt Image/IPX policy to trusted Drupal rich text.
 */
export function useOptimizedDrupalHtml(
  source: MaybeRefOrGetter<HtmlSource>,
  containerClass?: MaybeRefOrGetter<string | undefined>,
) {
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

    return optimizeDrupalRichTextImages(
      html,
      (canonicalSource, width, height, context) => {
        const layoutProfile = resolveLayoutImageDeliveryProfile(
          undefined,
          [
            context?.containerClass,
            toValue(containerClass),
          ].filter(Boolean).join(' '),
        )
        const sizes = layoutProfile
          ? image.profiles[layoutProfile]
          : context?.alignment === 'left' || context?.alignment === 'right'
            ? image.profiles.split
            : image.profiles.container

        return getSizes(canonicalSource, {
          sizes,
          modifiers: {
            format: image.format,
            height,
            quality: image.quality,
            width,
          },
        })
      },
      {
        baseClass: appConfig.stirTheme.media.base,
        roundedClass: appConfig.stirTheme.media.rounded,
      },
    )
  })
}
