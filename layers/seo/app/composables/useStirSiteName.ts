/**
 * The site name Drupal publishes, for titles and other prose.
 *
 * Reads the same global SEO payload the cms-global-seo plugin fetches, so a
 * site does not have to reach into that plugin's useAsyncData key itself.
 * Falls back to nuxt-site-config's name, then to the given default.
 */
export function useStirSiteName(fallback = '') {
  const globalSeo = useNuxtData<{ meta?: Array<Record<string, string>> } | null>(
    'cms-global-seo',
  )

  return computed(() => {
    const published = globalSeo.data.value?.meta?.find(
      tag => tag.property === 'og:site_name',
    )?.content?.trim()

    if (published) return published

    const configured = (useRuntimeConfig().public.site as { name?: string } | undefined)?.name

    return configured?.trim() || fallback
  })
}

/**
 * Formats a page title as "Title | Site name", without repeating the site
 * name when the title already carries it.
 */
export function formatStirSeoTitle(
  title: string | undefined,
  siteName: string,
): string {
  const normalizedSiteName = siteName.trim()
  const normalizedTitle = title?.trim()

  if (!normalizedTitle) return normalizedSiteName
  if (!normalizedSiteName) return normalizedTitle
  if (
    normalizedTitle === normalizedSiteName
    || normalizedTitle.endsWith(`| ${normalizedSiteName}`)
  ) {
    return normalizedTitle
  }

  return `${normalizedTitle} | ${normalizedSiteName}`
}

/**
 * A reactive "Title | Site name" for the current page.
 */
export function useStirSeoTitle(
  title: MaybeRefOrGetter<string | undefined>,
  fallbackSiteName = '',
) {
  const siteName = useStirSiteName(fallbackSiteName)

  return computed(() => formatStirSeoTitle(toValue(title), siteName.value))
}
