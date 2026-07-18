import { existsSync, readFileSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve as resolvePath } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  addTypeTemplate,
  findPath,
  useNuxt,
} from '@nuxt/kit'
import { createJiti } from 'jiti'
import {
  buildPresentationSource,
  loadPresentationManifest,
  type PresentationManifestMode,
} from './build/presentationManifest'
import {
  resolveDrupalImageDomain,
  resolveImageCdnBase,
} from './build/imageCdn'
import { buildSpaLoaderThemeStyle } from './build/spaLoaderTheme'

const themeLayerDir = dirname(fileURLToPath(import.meta.url))
const upstreamThemeCss = resolvePath(themeLayerDir, 'app/assets/css/main.css')
const appConfigTypes = resolvePath(themeLayerDir, 'app/types/app-config.d.ts')
const upstreamSpaLoadingTemplate = resolvePath(
  themeLayerDir,
  'app/spa-loading-template.html',
)
const compatibilitySafelistCss = resolvePath(
  themeLayerDir,
  'app/assets/css/safelist.inline.css',
)
const stirImageDelivery = process.env.STIR_IMAGE_DELIVERY === 'drupal'
  ? 'drupal'
  : 'nuxt'
const stirImageCdn = resolveImageCdnBase(
  process.env.NUXT_IMAGE_CDN,
  process.env.NODE_ENV === 'development',
)
const drupalImageDomain = resolveDrupalImageDomain(process.env.DRUPAL_URL)
const imageModuleDir = dirname(fileURLToPath(import.meta.resolve('@nuxt/image')))
const imageProviderComponent = stirImageDelivery === 'nuxt'
  ? resolvePath(imageModuleDir, 'runtime/components/NuxtImg.vue')
  : resolvePath(themeLayerDir, 'app/providers/NativeImageProvider.vue')
const ipxRuntimeProvider = resolvePath(
  themeLayerDir,
  'build/imageCdn.ts',
)
const loadModule = createJiti(import.meta.url, {
  interopDefault: false,
  moduleCache: false,
})

function hasCssEntry(entries: unknown[], path: string): boolean {
  return entries.some((entry) => {
    if (typeof entry === 'string') {
      return entry === path
    }

    return false
  })
}

export default defineNuxtConfig({
  alias: {
    '#stir-image-provider': imageProviderComponent,
  },
  modules: [
    ...(stirImageDelivery === 'nuxt' ? ['@nuxt/image'] : []),
    function registerStirAppConfigTypes() {
      addTypeTemplate({
        filename: 'types/stir-app-config.d.ts',
        getContents: () => readFileSync(appConfigTypes, 'utf8'),
      })
    },
  ],
  ...(stirImageDelivery === 'nuxt'
    ? {
        routeRules: {
          '/_ipx/**': {
            headers: {
              'cache-control': 'public, max-age=31536000, immutable',
            },
          },
        },
        image: {
          domains: drupalImageDomain ? [drupalImageDomain] : [],
          provider: 'stirIpx',
          ipx: {},
          providers: {
            stirIpx: {
              provider: ipxRuntimeProvider,
              ...(stirImageCdn
                ? {
                    options: {
                      baseURL: `${stirImageCdn}/_ipx`,
                    },
                  }
                : {}),
            },
          },
        },
      }
    : {}),
  appConfig: {
    stirImageDelivery,
  },
  hooks: {
    async 'modules:done'() {
      const nuxt = useNuxt()
      const appThemeCss = resolvePath(
        nuxt.options.srcDir,
        'assets/css/main.css',
      )
      const themeCss = existsSync(appThemeCss) ? appThemeCss : upstreamThemeCss

      if (!hasCssEntry(nuxt.options.css, themeCss)) {
        nuxt.options.css.push(themeCss)
      }

      const rootAppConfigPath = await findPath(
        resolvePath(nuxt.options.srcDir, 'app.config'),
      )
      let rootAppConfig: {
        ui?: { colors?: Record<string, unknown> }
      } = {}

      if (rootAppConfigPath) {
        const globals = globalThis as typeof globalThis & {
          defineAppConfig?: (config: unknown) => unknown
        }
        const previousDefineAppConfig = globals.defineAppConfig

        globals.defineAppConfig = (config) => config

        try {
          const loadedAppConfig = await loadModule.import<{
            default?: typeof rootAppConfig
          }>(rootAppConfigPath)

          rootAppConfig = loadedAppConfig.default || {}
        } finally {
          if (previousDefineAppConfig) {
            globals.defineAppConfig = previousDefineAppConfig
          } else {
            delete globals.defineAppConfig
          }
        }
      }

      const spaTemplateSource = typeof nuxt.options.spaLoadingTemplate === 'string'
        ? nuxt.options.spaLoadingTemplate
        : upstreamSpaLoadingTemplate
      const spaTemplate = readFileSync(spaTemplateSource, 'utf8')
      const generatedSpaTemplateDir = resolvePath(
        nuxt.options.rootDir,
        'node_modules/.cache/stir-spa-loader',
      )
      const generatedSpaTemplate = resolvePath(
        generatedSpaTemplateDir,
        'spa-loading-template.html',
      )

      await mkdir(generatedSpaTemplateDir, { recursive: true })
      await writeFile(
        generatedSpaTemplate,
        `${buildSpaLoaderThemeStyle(rootAppConfig)}\n${spaTemplate}`,
      )
      nuxt.options.spaLoadingTemplate = generatedSpaTemplate

      const mode = (process.env.STIR_PRESENTATION_MANIFEST_MODE || 'compatibility') as PresentationManifestMode

      if (!['compatibility', 'hybrid', 'strict'].includes(mode)) {
        throw new Error(`Invalid STIR_PRESENTATION_MANIFEST_MODE: ${mode}`)
      }
      if (mode === 'compatibility') {
        nuxt.options.alias['#stir-presentation-source'] = compatibilitySafelistCss
        return
      }

      const generationStartedAt = performance.now()
      const manifest = await loadPresentationManifest({
        source: process.env.STIR_PRESENTATION_MANIFEST,
        apiKey: process.env.STIR_PRESENTATION_MANIFEST_API_KEY,
        lastKnownPath: process.env.STIR_PRESENTATION_MANIFEST_LAST_KNOWN,
      })
      const generatedDir = resolvePath(
        nuxt.options.rootDir,
        'node_modules/.cache/stir-presentation',
      )
      const presentationSource = buildPresentationSource(manifest, mode)
      const generatedCss = resolvePath(
        generatedDir,
        `${manifest.revision}.${mode}.${presentationSource.sourceRevision}.inline.css`,
      )

      await mkdir(generatedDir, { recursive: true })
      await writeFile(generatedCss, presentationSource.source)
      nuxt.options.alias['#stir-presentation-source'] = generatedCss
      nuxt.options.runtimeConfig.public.stirPresentationManifestRevision = manifest.revision
      nuxt.options.runtimeConfig.public.stirPresentationBuild = {
        manifestRevision: manifest.revision,
        sourceRevision: presentationSource.sourceRevision,
        mode,
        utilityCount: presentationSource.utilityCount,
        manifestUsageCount: presentationSource.manifestUsageCount,
        legacyUtilityCount: presentationSource.legacyUtilityCount,
        rejectedLegacyUtilityCount: presentationSource.rejectedLegacyUtilityCount,
        sourceBytes: presentationSource.sourceBytes,
        generationDurationMs: Math.round((performance.now() - generationStartedAt) * 100) / 100,
        schemaVersion: manifest.schemaVersion,
        siteUuid: manifest.site.uuid,
        theme: manifest.site.theme,
      }
    },
  },
})
