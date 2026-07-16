import { fileURLToPath } from 'node:url'
import { normalizeEnvironmentUrl } from '../../config/runtime'

const resolveLayerPath = (path: string) =>
  fileURLToPath(new URL(`../../${path}`, import.meta.url))
const isTestEnv =
  process.env.NODE_ENV === 'test' || process.env.VITEST === 'true'
const isProductionEnv = process.env.NUXT_ENV === 'production'
const isIndexable = isProductionEnv && process.env.NUXT_INDEXABLE !== 'false'
const drupalUrl = normalizeEnvironmentUrl(process.env.DRUPAL_URL)

export default defineNuxtConfig({
  extends: ['../foundation', '../core', '../theme'],

  app: {
    head: {
      htmlAttrs: {
        class: 'scroll-smooth',
      },
    },
  },

  vite: {
    optimizeDeps: {
      include: [
        '@nuxt/ui > prosemirror-state',
        '@nuxt/ui > prosemirror-transform',
        '@nuxt/ui > prosemirror-model',
        '@nuxt/ui > prosemirror-view',
        '@nuxt/ui > prosemirror-gapcursor',
        '@plausible-analytics/tracker',
      ],
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
    '~/utils': resolveLayerPath('./layers/theme/app/utils'),
    '~/composables': resolveLayerPath('./layers/theme/app/composables'),
    '~/components': resolveLayerPath('./layers/theme/app/components'),
    '~/types': resolveLayerPath('./layers/theme/app/types'),
    '#stir/utils': resolveLayerPath('./layers/theme/app/utils'),
    '#stir/composables': resolveLayerPath('./layers/theme/app/composables'),
    '#stir/components': resolveLayerPath('./layers/theme/app/components'),
    '#stir/types': resolveLayerPath('./layers/theme/app/types'),
  },

  modules: [
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
})
