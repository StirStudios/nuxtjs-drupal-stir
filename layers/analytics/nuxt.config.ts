const isTestEnv =
  process.env.NODE_ENV === 'test' || process.env.VITEST === 'true'
const isProductionEnv = process.env.NUXT_ENV === 'production'
const isIndexable = isProductionEnv && process.env.NUXT_INDEXABLE !== 'false'

export default defineNuxtConfig({
  extends: ['../integrations'],

  modules: [...(!isTestEnv ? ['@nuxtjs/plausible'] : [])],

  hooks: {
    // plausible-config-bridge.client.ts owns the tracker and loads it on
    // demand; the module's own plugin would import it into the entry bundle.
    'app:resolve'(app) {
      app.plugins = app.plugins.filter(plugin => !/@nuxtjs[\\/]plausible[\\/]dist[\\/]runtime[\\/]plugin\.client(\.[cm]?js)?$/.test(plugin.src))
    },
  },

  runtimeConfig: {
    public: {
      plausible: {
        enabled: isIndexable,
        domain: process.env.NUXT_PUBLIC_PLAUSIBLE_DOMAIN || '',
        apiHost:
          process.env.NUXT_PUBLIC_PLAUSIBLE_API_HOST || 'https://plausible.io',
        autoPageviews: true,
        autoOutboundTracking: true,
        fileDownloads: true,
        formSubmissions: true,
        proxy: false,
        proxyBaseEndpoint: '/_plausible',
        ignoredHostnames: ['localhost', '127.0.0.1', '::1', 'local'],
        ignoreSubDomains: true,
      },
    },
  },
})
