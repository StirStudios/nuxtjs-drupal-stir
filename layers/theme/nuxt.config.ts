import { existsSync, readFileSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { dirname, resolve as resolvePath } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  addTypeTemplate,
  findPath,
  useLogger,
  useNuxt,
} from '@nuxt/kit'
import { createJiti } from 'jiti'
import {
  buildPresentationSource,
  loadPresentationManifest,
  resolvePresentationManifestSource,
} from './build/presentationManifest'
import {
  resolveDrupalImageDomains,
  resolveImageCdnBase,
} from './build/imageCdn'
import { buildSpaLoaderThemeStyle } from './build/spaLoaderTheme'
import { writeFileIfChanged } from './build/writeFileIfChanged'

const themeLayerDir = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolvePath(themeLayerDir, '../..')
const repositoryManifestFixture = resolvePath(
  repositoryRoot,
  'contracts/stir-tools/v1/fixtures/presentation-usage-manifest.json',
)
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
const presentationManifestLogger = useLogger('stir:presentation-manifest')

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
      await writeFileIfChanged(
        generatedSpaTemplate,
        `${buildSpaLoaderThemeStyle(rootAppConfig)}\n${spaTemplate}`,
      )
      nuxt.options.spaLoadingTemplate = generatedSpaTemplate

      const generationStartedAt = performance.now()
      const drupalUrl = process.env.DRUPAL_URL?.replace(/\/$/u, '')
      const isRepositoryBuild = nuxt.options.rootDir === repositoryRoot
        || nuxt.options.rootDir.startsWith(`${repositoryRoot}/tests/fixtures/`)
      const manifestSource = resolvePresentationManifestSource({
        source: process.env.STIR_PRESENTATION_MANIFEST,
        useFixture: process.env.STIR_PRESENTATION_MANIFEST_FIXTURE === '1',
        fixturePath: repositoryManifestFixture,
        repositoryBuild: isRepositoryBuild,
        drupalUrl,
      })
      const manifest = await loadPresentationManifest({
        source: manifestSource,
        apiKey: process.env.STIR_PRESENTATION_MANIFEST_API_KEY
          || process.env.DRUPAL_API_KEY,
        lastKnownPath: process.env.STIR_PRESENTATION_MANIFEST_LAST_KNOWN,
      })

      if (manifest.diagnostics.rejectedLegacyClassCount > 0) {
        presentationManifestLogger.warn(
          `Ignored ${manifest.diagnostics.rejectedLegacyClassCount} rejected legacy CMS utilities; valid presentation utilities will still be compiled`,
        )
      }
      const generatedDir = resolvePath(
        nuxt.options.rootDir,
        'node_modules/.cache/stir-presentation',
      )
      const presentationSource = buildPresentationSource(manifest)
      const generatedCss = resolvePath(
        generatedDir,
        `${manifest.revision}.${presentationSource.sourceRevision}.inline.css`,
      )

      await mkdir(generatedDir, { recursive: true })
      await writeFileIfChanged(generatedCss, presentationSource.source)
      nuxt.options.alias['#stir-presentation-source'] = generatedCss
      nuxt.options.runtimeConfig.public.stirPresentationManifestRevision = manifest.revision
      nuxt.options.runtimeConfig.public.stirPresentationBuild = {
        manifestRevision: manifest.revision,
        sourceRevision: presentationSource.sourceRevision,
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
