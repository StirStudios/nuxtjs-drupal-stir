export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('request', (event) => {
    const config = useRuntimeConfig()
    const apiKey = config.apiKey

    const path = event.node.req.url || ''
    const requiresDrupalApiKey =
      path.startsWith('/api/menu/') || path.startsWith('/api/drupal-ce/')

    if (requiresDrupalApiKey && typeof apiKey === 'string' && apiKey.trim().length > 0) {
      event.node.req.headers['x-api-key'] = apiKey
    }
  })
})
