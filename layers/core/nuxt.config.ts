const DRUPAL_CE_PROXY_ROUTES = new Set([
  '/api/drupal-ce',
  '/api/drupal-ce/**',
  '/api/menu/**',
])

const isDrupalCeModuleHandler = (
  handler: { handler?: unknown, route?: unknown } | null | undefined,
): boolean => {
  if (
    !handler
    || typeof handler.route !== 'string'
    || !DRUPAL_CE_PROXY_ROUTES.has(handler.route)
    || typeof handler.handler !== 'string'
  ) {
    return false
  }

  const path = handler.handler.replaceAll('\\', '/')

  return path.includes('/nuxtjs-drupal-ce/')
    && path.includes('/dist/runtime/server/api/')
}

export default defineNuxtConfig({
  hooks: {
    'nitro:config'(nitroConfig) {
      // The upstream proxy does not expose H3 cookie-filter hooks.
      nitroConfig.handlers = nitroConfig.handlers?.filter(
        handler => !isDrupalCeModuleHandler(handler),
      )
    },
  },
})
