/**
 * Normalizes markup that Drupal has already filtered.
 * Never use this boundary for browser, user, or third-party HTML.
 */
export function trustedDrupalHtml(html?: string | null): string {
  return html ?? ''
}
