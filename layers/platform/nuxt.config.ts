import { fileURLToPath } from 'node:url'
import { normalizeEnvironmentUrl } from '../../config/runtime'

const resolveLayerPath = (path: string) =>
  fileURLToPath(new URL(`../../${path}`, import.meta.url))
const isTestEnv =
  process.env.NODE_ENV === 'test' || process.env.VITEST === 'true'
const isDevelopment = process.env.NODE_ENV === 'development'
const drupalUrl = normalizeEnvironmentUrl(process.env.DRUPAL_URL)

export default defineNuxtConfig({
  extends: ['../foundation', '../core', '../theme', '../errors'],

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

  icon: {
    ...(isTestEnv ? { provider: 'none' as const } : {}),
    clientBundle: isTestEnv
      ? {
          scan: true,
          includeCustomCollections: true,
          sizeLimitKb: 256,
        }
      : {
          // Site contact data comes from Drupal, so these icon names cannot be
          // discovered by static source scanning. Bundle the common set to
          // keep first render independent of the runtime icon endpoint.
          icons: [
            'lucide:mail',
            'lucide:map-pin-plus-inside',
            'lucide:phone',
          ],
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

  // Drupal CE settings, under the keys the nuxtjs-drupal-ce module used so
  // the NUXT_PUBLIC_DRUPAL_CE_* runtime overrides keep working.
  runtimeConfig: {
    drupalCe: {
      // Drupal response headers the page fetch passes to the HTML response:
      // x-cache-tags reaches the foundation cache-tags plugin, and
      // x-stir-cache-until (Stir Tools) is the clock time the page's cache
      // ends, as its s-maxage may be a countdown Drupal's page cache repeated
      // from hours ago.
      passThroughHeaders: [
        ...(isDevelopment ? [] : ['cache-control']),
        'content-language',
        'set-cookie',
        'x-drupal-cache',
        'x-drupal-dynamic-cache',
        'x-cache-tags',
        'x-stir-cache-until',
      ],
    },
    public: {
      drupalCe: {
        drupalBaseUrl: drupalUrl,
        serverDrupalBaseUrl: '',
        ceApiEndpoint: '/ce-api',
        // Menus go through the CE API, where Lupus Decoupled keeps menu
        // links relative.
        menuBaseUrl: '',
        menuEndpoint: 'api/menu_items/$$$NAME$$$',
        useLocalizedMenuEndpoint: true,
      },
    },
  },
})
