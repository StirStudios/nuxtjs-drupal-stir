export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('request', async (event) => {
    const config = useRuntimeConfig()
    const apiKey = config.apiKey

    // Apply only to GET requests targeting /api/*
    if (
      event.node.req.method === 'GET' &&
      event.node.req.url?.startsWith('/api/') &&
      typeof apiKey === 'string' &&
      apiKey.length > 0
    ) {
      event.node.req.headers['x-api-key'] = apiKey
    }
  })

  // Stop execution immediately for 403 responses
  nitroApp.hooks.hook('beforeResponse', (event) => {
    if (event.node.res.statusCode === 403) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden',
        message: `Access denied to: ${event.node.req.url}`,
      })
    }
  })
})
