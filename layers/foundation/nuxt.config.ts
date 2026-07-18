import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  commaSeparatedEnvironment,
  normalizeEnvironmentUrl,
  positiveIntegerEnvironment,
} from '../../config/runtime'

const resolveLayerPath = (path: string) =>
  fileURLToPath(new URL(`../../${path}`, import.meta.url))
const require = createRequire(import.meta.url)
const isLayerWorkspace = resolve(process.cwd()) === resolve(resolveLayerPath('.'))
const foundationCss = fileURLToPath(
  new URL('./app/assets/css/main.css', import.meta.url),
)
const drupalUrl = normalizeEnvironmentUrl(process.env.DRUPAL_URL)
const isDevelopment = process.env.NODE_ENV === 'development'
const developmentNoStore = 'private, no-store, max-age=0'

export default defineNuxtConfig({
  compatibilityDate: '2026-05-29',

  app: {
    head: {
      htmlAttrs: {
        lang: 'en',
      },
    },
  },

  nitro: {
    compressPublicAssets: true,
    experimental: {
      asyncContext: true,
    },
  },

  routeRules: isDevelopment
    ? {
        '/**': {
          headers: {
            'cache-control': developmentNoStore,
            expires: '0',
            pragma: 'no-cache',
          },
        },
      }
    : {},

  devServer: {
    host: '127.0.0.1',
  },

  vite: {
    optimizeDeps: {
      include: ['@internationalized/date', '@vueuse/core', 'valibot'],
    },
    server: {
      allowedHosts:
        isDevelopment
          ? [process.env.SERVER_DOMAIN_CLIENT || 'localhost']
          : [],
      headers: isDevelopment
        ? {
            'Cache-Control': developmentNoStore,
            Expires: '0',
            Pragma: 'no-cache',
          }
        : undefined,
    },
    build: {
      minify: true,
    },
  },

  devtools: {
    enabled: isDevelopment,
  },

  experimental: {
    appManifest: false,
    entryImportMap: false,
    payloadExtraction: true,
  },

  alias: {
    valibot: require.resolve('valibot'),
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
  ] as Array<string | [string, Record<string, unknown>]>,

  runtimeConfig: {
    siteUrl: process.env.NUXT_URL || '',
    api: drupalUrl,
    apiKey: process.env.DRUPAL_API_KEY || '',
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

  hooks: {
    'ready'(nuxt) {
      const hasThemeLayer = nuxt.options._layers.some(layer =>
        layer.cwd.replaceAll('\\', '/').endsWith('/layers/theme'),
      )

      if (!hasThemeLayer && existsSync(foundationCss)) {
        nuxt.options.css.push(foundationCss)
      }
    },
  },
})
