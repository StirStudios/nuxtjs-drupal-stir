/**
 * Drupal's maintenance message from a 503 body, or ''.
 *
 * In Maintenance mode Drupal answers JSON and CE API routes with the site's
 * message as plain text. An HTML body is not a message: it is Drupal's themed
 * page for a route without `_format: 'json'`, or a proxy's error page while
 * Drupal is down.
 */
export function readStirDrupalMaintenanceMessage(body: unknown): string {
  const text = typeof body === 'string' ? body.trim() : ''

  return /<[a-z!/]/i.test(text) ? '' : text
}
