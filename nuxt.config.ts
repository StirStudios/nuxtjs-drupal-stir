import { createRequire } from 'node:module'
import { dirname, resolve as resolvePath } from 'node:path'
import { fileURLToPath } from 'node:url'

const layerDir = dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)
const isTestEnv =
  process.env.NODE_ENV === 'test' || process.env.VITEST === 'true'

export default defineNuxtConfig({
  compatibilityDate: '2026-04-19',

  css: ['~/assets/css/main.css'],

  features: {
    inlineStyles: true,
  },

  app: {
    head: {
      htmlAttrs: {
        lang: 'en',
        class: 'scroll-smooth',
      },
    },
  },

  nitro: {
    compressPublicAssets: true,
    experimental: {
      asyncContext: true,
    },
  },

  devServer: {
    host: '127.0.0.1',
  },

  vite: {
    optimizeDeps: {
      include: [
        '@nuxt/ui > prosemirror-state',
        '@nuxt/ui > prosemirror-transform',
        '@nuxt/ui > prosemirror-model',
        '@nuxt/ui > prosemirror-view',
        '@nuxt/ui > prosemirror-gapcursor',
      ],
    },
    server: {
      allowedHosts:
        process.env.NODE_ENV === 'development'
          ? [process.env.SERVER_DOMAIN_CLIENT || 'localhost']
          : [],
    },
    build: {
      minify: true,
    },
  },

  site: {
    name: process.env.NUXT_NAME,
    url: process.env.NUXT_URL,
    indexable: process.env.NUXT_ENV === 'production',
  },

  devtools: {
    enabled: process.env.NODE_ENV === 'development',
  },

  experimental: {
    appManifest: false,
  },

  routeRules: {
    '/login': {
      robots: false,
      sitemap: false,
    },
    '/admincontrol': {
      redirect: {
        to: `${process.env.DRUPAL_URL}/admincontrol/login`,
        statusCode: 302,
      },
    },
    '/admincontrol/login': {
      redirect: {
        to: `${process.env.DRUPAL_URL}/admincontrol/login`,
        statusCode: 302,
      },
    },
    '/admincontrol/password': {
      redirect: {
        to: `${process.env.DRUPAL_URL}/admincontrol/password`,
        statusCode: 302,
      },
    },
  },

  icon: {
    clientBundle: {
      scan: true,
      icons: ['lucide:chevron-left', 'lucide:chevron-right', 'lucide:arrow-up'],
      includeCustomCollections: true,
      sizeLimitKb: 256,
    },
    customCollections: [
      {
        prefix: 'social',
        dir: resolvePath(layerDir, 'app/assets/icons'),
      },
    ],
  },

  alias: {
    yup: require.resolve('yup'),
  },

  modules: [
    '@nuxt/ui',
    '@nuxt/eslint',
    '@nuxt/scripts',
    ...(!isTestEnv ? ['@nuxtjs/plausible'] : []),
    [
      'nuxt-vitalizer',
      {
        disableStylesheets: 'entry',
        disablePrefetchLinks: true,
        disablePreloadLinks: false,
        delayHydration: {
          hydrateOnEvents: ['mousemove', 'scroll', 'keydown', 'click'],
          idleCallbackTimeout: 8000,
          postIdleTimeout: 4000,
        },
      },
    ],

    [
      '@nuxtjs/turnstile',
      {
        siteKey: `${process.env.TURNSTILE_KEY}`,
      },
    ],

    [
      '@nuxtjs/robots',
      {
        // disallow: ['/secret', '/admin'],
      },
    ],

    ...(process.env.NUXT_INDEXABLE !== 'false'
      ? [
          [
            '@nuxtjs/sitemap',
            {
              sources: [`${process.env.DRUPAL_URL}/api/sitemap`],
              exclude: ['/login'],
              runtimeCacheStorage: { driver: 'memory' },
              cacheMaxAgeSeconds: 0,
              xslColumns: [
                { label: 'URL', width: '50%' },
                {
                  label: 'Last Modified',
                  select: 'sitemap:lastmod',
                  width: '25%',
                },
                {
                  label: 'Priority',
                  select: 'sitemap:priority',
                  width: '12.5%',
                },
                {
                  label: 'Change Frequency',
                  select: 'sitemap:changefreq',
                  width: '12.5%',
                },
              ],
            },
          ],
        ]
      : []),

    [
      'nuxtjs-drupal-ce',
      {
        drupalBaseUrl: process.env.DRUPAL_URL,
        exposeAPIRouteRules: true,
        disableFormHandler: true,
        enableComponentPreview: false,
        customErrorPages: true,
      },
    ],
  ] as Array<string | [string, Record<string, unknown>]>,

  runtimeConfig: {
    api: process.env.DRUPAL_URL,
    apiKey: process.env.DRUPAL_API_KEY || '',
    turnstile: {
      secretKey: process.env.TURNSTILE_SECRET,
    },
    public: {
      api: process.env.DRUPAL_URL,
      plausible: {
        enabled: false,
        domain: '',
        apiHost: process.env.NUXT_PUBLIC_PLAUSIBLE_API_HOST || '',
        autoPageviews: true,
        proxy: true,
        proxyBaseEndpoint: '/_plausible',
        ignoredHostnames: ['localhost', '127.0.0.1', '::1', 'local'],
        ignoreSubDomains: true,
      },
    },
  },
})
