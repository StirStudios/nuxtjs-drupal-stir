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
const sitemapSources = drupalUrl ? [`${drupalUrl}/api/sitemap`] : []
const sitemapExcludedRoutes = [
  '/account/**',
  '/auth/**',
  '/login',
]
const sitemapSwrEnabled =
  process.env.NUXT_SITEMAP_SWR === 'true' && sitemapSources.length > 0
const sitemapSwrTtl = Number.parseInt(
  process.env.NUXT_SITEMAP_SWR_TTL || '300',
  10,
)
const turnstileSiteKey = process.env.TURNSTILE_KEY || ''
const sitemapModuleOptions = {
  sources: sitemapSources,
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

type SitemapInputEntry = string | { loc?: string | URL; url?: string | URL }

type SitemapInputContext = {
  urls: SitemapInputEntry[]
}

type RouteRules = Record<string, Record<string, unknown>>

function sitemapEntryLoc(entry: SitemapInputEntry): string | null {
  const loc = typeof entry === 'string' ? entry : entry.loc || entry.url

  return loc ? String(loc) : null
}

function sitemapDedupeKey(entry: SitemapInputEntry): string | null {
  const loc = sitemapEntryLoc(entry)

  if (!loc) {
    return null
  }

  try {
    const url = new URL(loc, 'https://example.com')
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

function routePathFromSitemapLoc(loc: string): string | null {
  try {
    const url = new URL(loc.replaceAll('&amp;', '&'), drupalUrl)
    const pathname =
      url.pathname === '/' ? '/' : url.pathname.replace(/\/+$/, '')

    if (pathname.startsWith('/api/') || pathname.startsWith('/_nuxt/')) {
      return null
    }

    return pathname
  } catch {
    return null
  }
}

function sitemapLocsFromSource(source: string): string[] {
  try {
    const urls = JSON.parse(source) as unknown

    if (Array.isArray(urls)) {
      return urls
        .map((entry) => sitemapEntryLoc(entry as SitemapInputEntry))
        .filter((loc): loc is string => loc !== null)
    }
  } catch {
    // Fall back to XML parsing below.
  }

  return [...source.matchAll(/<loc>(.*?)<\/loc>/gims)]
    .map((match) => match[1])
    .filter((loc): loc is string => Boolean(loc))
}

async function loadSitemapSwrRouteRules(): Promise<RouteRules> {
  if (!sitemapSwrEnabled || !Number.isFinite(sitemapSwrTtl)) {
    return {}
  }

  const sitemapSource = sitemapSources[0]

  if (!sitemapSource) {
    return {}
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 3000)

  try {
    const response = await fetch(sitemapSource, {
      signal: controller.signal,
    })

    if (!response.ok) {
      return {}
    }

    const sitemapSourceText = await response.text()
    const routeRules: RouteRules = {}

    for (const loc of sitemapLocsFromSource(sitemapSourceText)) {
      const pathname = routePathFromSitemapLoc(loc.trim())

      if (pathname) {
        routeRules[pathname] = { swr: sitemapSwrTtl }
      }
    }

    return routeRules
  } catch {
    return {}
  } finally {
    clearTimeout(timeout)
  }
}

const sitemapSwrRouteRules = await loadSitemapSwrRouteRules()

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

  hooks: {
    'sitemap:input'(ctx: SitemapInputContext) {
      ctx.urls = dedupeSitemapUrls(ctx.urls)
    },
  } as Record<string, (ctx: SitemapInputContext) => void>,

  routeRules: {
    ...sitemapSwrRouteRules,
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
