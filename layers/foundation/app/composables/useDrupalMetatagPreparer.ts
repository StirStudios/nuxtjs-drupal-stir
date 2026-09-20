/**
 * Drupal page metatags as the CE API returns them.
 */
export type StirDrupalMetatags = {
  meta: Array<Record<string, string>>
  link: Array<Record<string, string>>
  [key: string]: unknown
}

/**
 * Returns the SEO layer's metatag preparation, or passes tags through.
 *
 * The SEO layer registers it from a plugin, so page rendering never imports
 * SEO code in presets that omit that layer.
 */
export function useDrupalMetatagPreparer(): (metatags: StirDrupalMetatags) => StirDrupalMetatags {
  const nuxtApp = useNuxtApp() as unknown as {
    $stirPrepareDrupalMetatags?: (metatags: StirDrupalMetatags) => StirDrupalMetatags
  }

  return nuxtApp.$stirPrepareDrupalMetatags ?? (metatags => metatags)
}
