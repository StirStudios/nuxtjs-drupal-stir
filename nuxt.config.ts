import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const resolveLayerPath = (path: string) =>
  fileURLToPath(new URL(path, import.meta.url))
const isTestEnv =
  process.env.NODE_ENV === 'test' || process.env.VITEST === 'true'
const isProductionEnv = process.env.NUXT_ENV === 'production'
const isIndexable = isProductionEnv && process.env.NUXT_INDEXABLE !== 'false'
const drupalUrl = process.env.DRUPAL_URL || ''
const turnstileSiteKey = process.env.TURNSTILE_KEY || ''

type SitemapInputEntry = string | { loc?: string | URL; url?: string | URL }

type SitemapInputContext = {
  urls: SitemapInputEntry[]
}

function sitemapDedupeKey(entry: SitemapInputEntry): string | null {
  const loc = typeof entry === 'string' ? entry : entry.loc || entry.url

  if (!loc) {
    return null
  }

  try {
    const url = new URL(String(loc), 'https://example.com')
    const pathname =
      url.pathname === '/' ? '/' : url.pathname.replace(/\/+$/, '')

    return url.search ? pathname + url.search : pathname
  } catch {
    return null
  }
}

function dedupeSitemapUrls<T extends SitemapInputEntry>(urls: T[]): T[] {
  const seen = new Set<string>()

  return urls.filter((entry) => {
    const key = sitemapDedupeKey(entry)

    if (key === null) {
      return true
    }

    if (seen.has(key)) {
      return false
    }

    seen.add(key)
    return true
  })
}

export default defineNuxtConfig({
  compatibilityDate: '2026-05-29',
  extends: ['./layers/core', './layers/theme', './layers/auth'],

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
        '@internationalized/date',
        '@nuxt/ui > prosemirror-state',
        '@nuxt/ui > prosemirror-transform',
        '@nuxt/ui > prosemirror-model',
        '@nuxt/ui > prosemirror-view',
        '@nuxt/ui > prosemirror-gapcursor',
        '@plausible-analytics/tracker',
        '@vue/devtools-core',
        '@vue/devtools-kit',
        '@vueuse/core',
        'yup',
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
    plugins: [
      {
        apply: 'build',
        name: 'vite-plugin-ignore-sourcemap-warnings',
        configResolved(config) {
          const originalOnWarn = config.build.rollupOptions.onwarn

          config.build.rollupOptions.onwarn = (warning, warn) => {
            if (
              warning.code === 'SOURCEMAP_BROKEN' &&
              warning.plugin === '@tailwindcss/vite:generate:build'
            ) {
              return
            }

            if (originalOnWarn) {
              originalOnWarn(warning, warn)
            } else {
              warn(warning)
            }
          }
        },
      },
    ],
  },

  site: {
    name: process.env.NUXT_NAME,
    url: process.env.NUXT_URL,
    indexable: isIndexable,
  },

  devtools: {
    enabled: process.env.NODE_ENV === 'development',
  },

  experimental: {
    appManifest: false,
    entryImportMap: false,
  },

  hooks: {
    'sitemap:input'(ctx: SitemapInputContext) {
      ctx.urls = dedupeSitemapUrls(ctx.urls)
    },
  } as Record<string, (ctx: SitemapInputContext) => void>,

  routeRules: {
    '/login': {
      robots: false,
    },
  } as Record<string, Record<string, unknown>>,

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
        dir: resolveLayerPath('./layers/theme/app/assets/icons'),
      },
    ],
  },

  alias: {
    yup: require.resolve('yup'),
    '~/utils': resolveLayerPath('./layers/theme/app/utils'),
    '~/composables': resolveLayerPath('./layers/theme/app/composables'),
    '~/components': resolveLayerPath('./layers/theme/app/components'),
    '~/types': resolveLayerPath('./types'),
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
      },
    ],

    [
      '@nuxtjs/turnstile',
      {
        siteKey: turnstileSiteKey,
      },
    ],

    [
      '@nuxtjs/robots',
      {
        // disallow: ['/secret', '/admin'],
      },
    ],

    ...(isIndexable
      ? [
          [
            '@nuxtjs/sitemap',
            {
              sources: drupalUrl ? [`${drupalUrl}/api/sitemap`] : [],
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
        drupalBaseUrl: drupalUrl,
        menuBaseUrl:
          process.env.NUXT_PUBLIC_DRUPAL_CE_MENU_BASE_URL || drupalUrl,
        exposeAPIRouteRules: true,
        disableFormHandler: true,
        enableComponentPreview: false,
        customErrorPages: true,
      },
    ],
  ] as Array<string | [string, Record<string, unknown>]>,

  runtimeConfig: {
    api: drupalUrl,
    apiKey: process.env.DRUPAL_API_KEY || '',
    protectedPassword: process.env.PROTECTED_PASSWORD || '',
    turnstile: {
      secretKey: process.env.TURNSTILE_SECRET,
    },
    public: {
      api: drupalUrl,
      plausible: {
        enabled: isIndexable,
        domain: process.env.NUXT_PUBLIC_PLAUSIBLE_DOMAIN || '',
        apiHost: process.env.NUXT_PUBLIC_PLAUSIBLE_API_HOST || '',
        autoPageviews: true,
        proxy: false,
        proxyBaseEndpoint: '/_plausible',
        ignoredHostnames: ['localhost', '127.0.0.1', '::1', 'local'],
        ignoreSubDomains: true,
      },
    },
  },
})
