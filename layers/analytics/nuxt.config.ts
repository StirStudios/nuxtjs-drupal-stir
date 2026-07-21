const isTestEnv =
  process.env.NODE_ENV === 'test' || process.env.VITEST === 'true'
const isProductionEnv = process.env.NUXT_ENV === 'production'
const isIndexable = isProductionEnv && process.env.NUXT_INDEXABLE !== 'false'

export default defineNuxtConfig({
  extends: ['../integrations'],

  modules: [...(!isTestEnv ? ['@nuxtjs/plausible'] : [])],

  runtimeConfig: {
    public: {
      plausible: {
        enabled: isIndexable,
        domain: process.env.NUXT_PUBLIC_PLAUSIBLE_DOMAIN || '',
        apiHost:
          process.env.NUXT_PUBLIC_PLAUSIBLE_API_HOST || 'https://plausible.io',
        autoPageviews: true,
        proxy: false,
        proxyBaseEndpoint: '/_plausible',
        ignoredHostnames: ['localhost', '127.0.0.1', '::1', 'local'],
        ignoreSubDomains: true,
      },
    },
  },
})
