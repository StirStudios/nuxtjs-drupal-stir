export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('request', (event) => {
    const config = useRuntimeConfig()
    const apiKey = config.apiKey

    if (
      event.node.req.url?.startsWith('/api/') &&
      typeof apiKey === 'string' &&
      apiKey.trim().length > 0
    ) {
      event.node.req.headers['x-api-key'] = apiKey
    }
  })
})
