/** The Nuxt layout for a Drupal page: its page_layout, or default. */
export function resolveDrupalPageLayout(value: unknown): string {
  return typeof value === 'string' && value.trim() ? value.trim() : 'default'
}

/**
 * setPageLayout for a Drupal page_layout. Nuxt types layout names to the
 * layouts known at build time, but Drupal can name a site's own layout, such
 * as clients, which this layer can't know.
 */
export function setDrupalPageLayout(name: string): void {
  setPageLayout(name as Parameters<typeof setPageLayout>[0])
}
