import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { addServerHandler, defineNuxtModule, hasNuxtModule, useLogger } from '@nuxt/kit'
import { addMissingReviewSections } from '../../scripts/compliance/review.mjs'
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
const siteUrl = process.env.NUXT_SITE_URL || ''
const developmentNoStore = 'private, no-store, max-age=0'
const isIndexable =
  process.env.NUXT_ENV === 'production' && process.env.NUXT_INDEXABLE !== 'false'

// Every consumer loads this layer, so Robots enforces indexability for
// applications that omit the SEO capability as well as for full websites.
const siteConfig = {
  site: {
    name: process.env.NUXT_SITE_NAME,
    url: siteUrl || undefined,
    indexable: isIndexable,
  },
}

// Application mode: a composition without the SEO capability publishes no
// sitemap and is never indexable, whatever NUXT_ENV or NUXT_INDEXABLE say.
// Registered before Robots, which reads the site config when it installs.
const applicationMode = defineNuxtModule({
  meta: {
    name: 'stir-application-mode',
  },
  setup(_options, nuxt) {
    if (hasNuxtModule('@nuxtjs/sitemap', nuxt)) return

    if (nuxt.options.site) nuxt.options.site.indexable = false

    // Sitemap and llms.txt paths return a real 404 instead of the application renderer.
    const handler = fileURLToPath(
      new URL('./server/handlers/sitemap-unavailable.ts', import.meta.url),
    )

    for (const route of ['/sitemap.xml', '/sitemap_index.xml', '/__sitemap__/**', '/llms.txt']) {
      addServerHandler({ route, handler })
    }

    nuxt.hook('modules:done', () => {
      // Robots resolves indexability on the server, so keep its site-config
      // plugin out of the initial client graph.
      for (const plugin of nuxt.options.plugins) {
        if (
          typeof plugin !== 'string'
          && plugin.src.replaceAll('\\', '/').includes('/nuxt-site-config/dist/runtime/app/plugins/0.siteConfig')
        ) {
          plugin.mode = 'server'
        }
      }
    })
  },
})

// A layer update that adds review checklists refreshes the site's
// compliance/REVIEW.md on install (`nuxt prepare`) and in development, so the
// change is committed with the lockfile instead of failing CI later. Never in
// CI or a build, and never for a site without a REVIEW.md.
const complianceChecklists = defineNuxtModule({
  meta: {
    name: 'stir-compliance-checklists',
  },
  setup(_options, nuxt) {
    if (isLayerWorkspace || process.env.CI || !(nuxt.options._prepare || nuxt.options.dev)) return

    const reviewPath = resolve(nuxt.options.rootDir, 'compliance/REVIEW.md')

    if (!existsSync(reviewPath)) return

    const template = readFileSync(resolveLayerPath('scripts/compliance/templates/REVIEW.md'), 'utf8')
    const { review, changed } = addMissingReviewSections(readFileSync(reviewPath, 'utf8'), template)

    if (!changed) return

    writeFileSync(reviewPath, review)
    useLogger('stir').info('Added the current review checklists to compliance/REVIEW.md; commit it with this update.')
  },
})

export default defineNuxtConfig({
  ...siteConfig,
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
          ? [URL.canParse(siteUrl) ? new URL(siteUrl).hostname : 'localhost']
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
    // Render error.vue inside the failed request, keeping its headers and
    // cookies, instead of re-entering Nitro via /__nuxt_error (Nuxt 4.6).
    inlineErrorRendering: true,
    payloadExtraction: true,
  },

  alias: {
    valibot: require.resolve('valibot'),
  },

  modules: [
    '@nuxt/ui',
    applicationMode,
    complianceChecklists,
    '@nuxtjs/robots',
    ...(isLayerWorkspace ? ['@nuxt/eslint'] : []),
    [
      'nuxt-vitalizer',
      {
        disablePrefetchLinks: true,
        disablePreloadLinks: true,
      },
    ],
  ] as Array<
    | string
    | typeof applicationMode
    | typeof complianceChecklists
    | [string, Record<string, unknown>]
  >,

  runtimeConfig: {
    siteUrl,
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
      // Build-time label like indexability: anything but production shows the
      // environment badge in the editorial tabs.
      environment: process.env.NUXT_ENV || 'development',
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
