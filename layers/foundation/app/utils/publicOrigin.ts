/**
 * Resolves the site's public origin for absolute URLs such as canonicals.
 *
 * On the server the configured NUXT_URL (runtimeConfig.siteUrl) wins, so a
 * proxied request host cannot leak into links; otherwise the request origin
 * is used. nuxt-site-config is server-only here to keep it off the client.
 */
export function resolveStirPublicOrigin(): string {
  const requestOrigin = useRequestURL().origin
  const siteUrl = import.meta.server ? useRuntimeConfig().siteUrl : ''

  if (typeof siteUrl !== 'string' || !siteUrl.trim()) return requestOrigin

  try {
    return new URL(siteUrl).origin
  }
  catch {
    return requestOrigin
  }
}
