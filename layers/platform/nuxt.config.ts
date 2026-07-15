import { mkdirSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { SitemapRenderCtx } from '@nuxtjs/sitemap'
import {
  commaSeparatedEnvironment,
  normalizeEnvironmentUrl,
  positiveIntegerEnvironment,
} from '../../config/runtime'
import {
  buildSitemapModuleOptions,
  dedupeResolvedSitemapUrls,
} from '../../config/sitemap'

const require = createRequire(import.meta.url)
const resolveLayerPath = (path: string) =>
  fileURLToPath(new URL(`../../${path}`, import.meta.url))
const isLayerWorkspace = resolve(process.cwd()) === resolve(resolveLayerPath('.'))
const isTestEnv =
  process.env.NODE_ENV === 'test' || process.env.VITEST === 'true'
const isProductionEnv = process.env.NUXT_ENV === 'production'
const isIndexable = isProductionEnv && process.env.NUXT_INDEXABLE !== 'false'
const drupalUrl = normalizeEnvironmentUrl(process.env.DRUPAL_URL)
const sitemapModuleOptions = buildSitemapModuleOptions(drupalUrl)

type RouteRules = Record<string, Record<string, unknown>>
type AnalysisOutputOptions = { dir?: string }
type AnalysisOutputChunk = {
  type: 'chunk'
  isEntry: boolean
  fileName: string
  modules: Record<string, { renderedLength: number }>
}
type AnalysisOutputAsset = { type: 'asset' }
type AnalysisOutputBundle = Record<
  string,
  AnalysisOutputChunk | AnalysisOutputAsset
>

export default defineNuxtConfig({
  compatibilityDate: '2026-05-29',
  extends: ['../core', '../theme'],

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
      ...(process.env.STIR_PERF_ANALYZE === 'true'
        ? [{
            apply: 'build' as const,
            name: 'stir-client-entry-analysis',
            generateBundle(
              _options: AnalysisOutputOptions,
              bundle: AnalysisOutputBundle,
            ) {
              if (!String(_options.dir || '').includes('/client')) return

              const entries = Object.values(bundle)
                .filter((asset): asset is AnalysisOutputChunk =>
                  asset.type === 'chunk' && asset.isEntry,
                )
                .map((chunk) => ({
                  fileName: chunk.fileName,
                  modules: Object.entries(chunk.modules)
                    .map(([id, details]) => ({
                      id,
                      renderedBytes: details.renderedLength,
                    }))
                    .sort((left, right) => right.renderedBytes - left.renderedBytes),
                }))

              if (!entries.length) return

              mkdirSync(resolveLayerPath('./.audit'), { recursive: true })
              writeFileSync(
                resolveLayerPath('./.audit/client-entry-modules.json'),
                `${JSON.stringify({ entries }, null, 2)}\n`,
              )
            },
          }]
        : []),
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
    ...(isTestEnv ? { provider: 'none' as const } : {}),
    clientBundle: isTestEnv
      ? {
          scan: true,
          includeCustomCollections: true,
          sizeLimitKb: 256,
        }
      : {
          scan: false,
          includeCustomCollections: false,
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
    ...(isLayerWorkspace ? ['@nuxt/eslint'] : []),
    [
      'nuxt-vitalizer',
      {
        disablePrefetchLinks: true,
        disablePreloadLinks: true,
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
    siteUrl: process.env.NUXT_URL || '',
    api: drupalUrl,
    apiKey: process.env.DRUPAL_API_KEY || '',
    protectedPassword: process.env.PROTECTED_PASSWORD || '',
    protectedCookieSecret: process.env.PROTECTED_COOKIE_SECRET || '',
    protectedRateLimit: {
      enabled: process.env.PROTECTED_RATE_LIMIT_ENABLED !== 'false',
      maxAttempts: positiveIntegerEnvironment(
        process.env.PROTECTED_RATE_LIMIT_MAX_ATTEMPTS,
        5,
      ),
      windowSeconds: positiveIntegerEnvironment(
        process.env.PROTECTED_RATE_LIMIT_WINDOW_SECONDS,
        15 * 60,
      ),
      trustProxy: process.env.PROTECTED_RATE_LIMIT_TRUST_PROXY === 'true',
    },
    drupalRequestTimeoutMs: positiveIntegerEnvironment(
      process.env.DRUPAL_REQUEST_TIMEOUT_MS,
      10_000,
    ),
    drupalSessionCookieNames: commaSeparatedEnvironment(
      process.env.DRUPAL_SESSION_COOKIE_NAMES,
    ),
    drupalClientIpForwarding: {
      enabled: process.env.DRUPAL_FORWARD_CLIENT_IP === 'true',
      trustProxy: process.env.DRUPAL_TRUST_PROXY === 'true',
    },
    public: {
      api: drupalUrl,
    },
  },
})
