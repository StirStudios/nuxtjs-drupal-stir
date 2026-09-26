import { existsSync, readFileSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { dirname, resolve as resolvePath } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  addTypeTemplate,
  findPath,
  hasNuxtModule,
  useLogger,
  useNuxt,
} from '@nuxt/kit'
import { createJiti } from 'jiti'
import {
  buildPresentationSource,
  catalogueUtilities,
  mergePresentationConfigs,
  type PresentationConfig,
} from './build/presentationSource'
import {
  resolveDrupalImageDomains,
  resolveImageCdnBase,
} from './build/imageCdn'
import { buildSpaLoaderThemeStyle } from './build/spaLoaderTheme'
import { writeFileIfChanged } from './build/writeFileIfChanged'
import { STIR_PRESENTATION_DEFAULTS } from './app/utils/presentationDefaults'
import { overrideFallbackComponent } from '../../config/componentOverrides'

const themeLayerDir = dirname(fileURLToPath(import.meta.url))
const upstreamThemeCss = resolvePath(themeLayerDir, 'app/assets/css/main.css')
const appConfigTypes = resolvePath(themeLayerDir, 'app/types/app-config.d.ts')
const upstreamSpaLoadingTemplate = resolvePath(
  themeLayerDir,
  'app/spa-loading-template.html',
)
const stirImageCdn = resolveImageCdnBase(
  process.env.NUXT_IMAGE_CDN,
  process.env.NODE_ENV === 'development',
)
const drupalImageDomains = resolveDrupalImageDomains(
  process.env.DRUPAL_URL,
  process.env.DRUPAL_CDN,
)
const imageModuleDir = dirname(fileURLToPath(import.meta.resolve('@nuxt/image')))
const imageProviderComponent = resolvePath(imageModuleDir, 'runtime/components/NuxtImg.vue')
const ipxRuntimeProvider = resolvePath(
  themeLayerDir,
  'build/imageCdn.ts',
)
const loadModule = createJiti(import.meta.url, {
  interopDefault: false,
  moduleCache: false,
})
const presentationLogger = useLogger('stir:presentation')

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
    '@nuxt/image',
    '@nuxt/scripts',
    function useInstalledPdfViewer() {
      // Projects that install the vue-pdf-viewer-core Nuxt module get the real
      // viewer; others keep the lightweight stub and never load the viewer.
      overrideFallbackComponent(
        'StirPdfViewer',
        resolvePath(themeLayerDir, 'app/components/StirPdfViewer.client.vue'),
        resolvePath(themeLayerDir, 'app/pdf/StirPdfViewer.client.vue'),
        () => hasNuxtModule('vue-pdf-viewer-core'),
      )
    },
    function registerStirAppConfigTypes() {
      addTypeTemplate({
        filename: 'types/stir-app-config.d.ts',
        getContents: () => readFileSync(appConfigTypes, 'utf8'),
      })
    },
  ],
  routeRules: {
    '/_ipx/**': {
      headers: {
        'cache-control': 'public, max-age=31536000, immutable',
      },
    },
  },
  image: {
    domains: drupalImageDomains,
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

      const importAppConfig = async (path: string): Promise<{
        ui?: { colors?: Record<string, unknown> }
        stirTheme?: { presentation?: PresentationConfig }
      }> => {
        const globals = globalThis as typeof globalThis & {
          defineAppConfig?: (config: unknown) => unknown
        }
        const previousDefineAppConfig = globals.defineAppConfig

        globals.defineAppConfig = (config) => config

        try {
          const loadedAppConfig = await loadModule.import<{
            default?: Awaited<ReturnType<typeof importAppConfig>>
          }>(path)

          return loadedAppConfig.default || {}
        } finally {
          if (previousDefineAppConfig) {
            globals.defineAppConfig = previousDefineAppConfig
          } else {
            delete globals.defineAppConfig
          }
        }
      }

      const rootAppConfigPath = await findPath(
        resolvePath(nuxt.options.srcDir, 'app.config'),
      )
      const rootAppConfig = rootAppConfigPath ? await importAppConfig(rootAppConfigPath) : {}

      // Every layer's app config, nearest first, as Nuxt merges them: a
      // catalogue declared in an intermediate layer must be compiled too.
      const layerPresentations: PresentationConfig[] = []

      for (const layer of nuxt.options._layers) {
        const layerAppConfigPath = await findPath(resolvePath(layer.config.srcDir, 'app.config'))

        if (layerAppConfigPath) {
          const layerAppConfig = layerAppConfigPath === rootAppConfigPath
            ? rootAppConfig
            : await importAppConfig(layerAppConfigPath)

          layerPresentations.push(layerAppConfig.stirTheme?.presentation || {})
        }
      }

      if (nuxt.options.spaLoadingTemplate !== false) {
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
        await writeFileIfChanged(
          generatedSpaTemplate,
          `${buildSpaLoaderThemeStyle(rootAppConfig)}\n${spaTemplate}`,
        )
        nuxt.options.spaLoadingTemplate = generatedSpaTemplate
      }

      const generationStartedAt = performance.now()
      const presentation = mergePresentationConfigs([
        ...layerPresentations,
        STIR_PRESENTATION_DEFAULTS,
      ])
      const generatedDir = resolvePath(
        nuxt.options.rootDir,
        'node_modules/.cache/stir-presentation',
      )
      const presentationSource = buildPresentationSource({
        extraUtilities: catalogueUtilities(presentation, {
          warn: message => presentationLogger.warn(message),
        }),
      })
      const generatedCss = resolvePath(
        generatedDir,
        `${presentationSource.sourceRevision}.inline.css`,
      )

      await mkdir(generatedDir, { recursive: true })
      await writeFileIfChanged(generatedCss, presentationSource.source)
      nuxt.options.alias['#stir-presentation-source'] = generatedCss
      nuxt.options.runtimeConfig.public.stirPresentationBuild = {
        sourceRevision: presentationSource.sourceRevision,
        utilityCount: presentationSource.utilityCount,
        sourceBytes: presentationSource.sourceBytes,
        generationDurationMs: Math.round((performance.now() - generationStartedAt) * 100) / 100,
      }
    },
  },
})
