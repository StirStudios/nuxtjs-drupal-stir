import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import type { ResolvedSitemapUrl, SitemapRenderCtx } from '@nuxtjs/sitemap'

const require = createRequire(import.meta.url)
const resolveLayerPath = (path: string) =>
  fileURLToPath(new URL(path, import.meta.url))
const isTestEnv =
  process.env.NODE_ENV === 'test' || process.env.VITEST === 'true'
const isProductionEnv = process.env.NUXT_ENV === 'production'
const isIndexable = isProductionEnv && process.env.NUXT_INDEXABLE !== 'false'
const drupalUrl = process.env.DRUPAL_URL || ''
const sitemapSources = drupalUrl ? [`${drupalUrl}/api/sitemap`] : []
const sitemapExcludedRoutes = [
  '/account/**',
  '/auth/**',
  '/login',
]
const turnstileSiteKey = process.env.TURNSTILE_KEY || ''
const sitemapModuleOptions = {
  sources: sitemapSources,
  excludeAppSources: ['nuxt:route-rules'],
  exclude: sitemapExcludedRoutes,
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
}

type RouteRules = Record<string, Record<string, unknown>>

function sitemapCanonicalKey(loc: string): string | null {
  try {
    const url = new URL(
      loc.replaceAll('&amp;', '&'),
      process.env.NUXT_URL || 'https://example.com',
    )
    const pathname =
      url.pathname === '/' ? '/' : url.pathname.replace(/\/+$/, '')

    return url.search ? pathname + url.search : pathname
  } catch {
    return null
  }
}

function sitemapMetadataScore(entry: ResolvedSitemapUrl): number {
  return Number(Boolean(entry.lastmod)) +
    Number(Boolean(entry.changefreq)) +
    Number(entry.priority !== undefined)
}

function dedupeResolvedSitemapUrls(
  urls: ResolvedSitemapUrl[],
): ResolvedSitemapUrl[] {
  const deduped: ResolvedSitemapUrl[] = []
  const indexes = new Map<string, number>()

  for (const entry of urls) {
    const key = sitemapCanonicalKey(entry.loc)

    if (key === null) {
      deduped.push(entry)
      continue
    }

    const existingIndex = indexes.get(key)

    if (existingIndex === undefined) {
      indexes.set(key, deduped.length)
      deduped.push(entry)
      continue
    }

    const existingEntry = deduped[existingIndex]

    if (
      existingEntry &&
      sitemapMetadataScore(entry) > sitemapMetadataScore(existingEntry)
    ) {
      deduped[existingIndex] = entry
    }
  }

  return deduped
}

export default defineNuxtConfig({
  compatibilityDate: '2026-05-29',
  extends: ['./layers/core', './layers/theme', './layers/auth'],

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
    hooks: {
      'sitemap:resolved'(ctx: SitemapRenderCtx) {
        ctx.urls = dedupeResolvedSitemapUrls(ctx.urls)
      },
    } as Record<string, (ctx: SitemapRenderCtx) => void>,
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
    payloadExtraction: true,
  },

  routeRules: {
    '/account/**': {
      robots: false,
    },
    '/auth/**': {
      robots: false,
    },
    '/login': {
      robots: false,
    },
  } as RouteRules,

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
    '~/types': resolveLayerPath('./layers/theme/app/types'),
  },

  modules: [
    '@nuxt/ui',
    '@nuxt/eslint',
    '@nuxt/scripts',
    ...(!isTestEnv ? ['@nuxtjs/plausible'] : []),
    [
      'nuxt-vitalizer',
      {
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

    [
      '@nuxtjs/sitemap',
      sitemapModuleOptions,
    ],

    [
      'nuxtjs-drupal-ce',
      {
        drupalBaseUrl: drupalUrl,
        menuBaseUrl: drupalUrl,
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
