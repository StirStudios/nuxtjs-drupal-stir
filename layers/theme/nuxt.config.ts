import { existsSync, readFileSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve as resolvePath } from 'node:path'
import { fileURLToPath } from 'node:url'
import { addTypeTemplate, useNuxt } from '@nuxt/kit'
import {
  buildPresentationSource,
  loadPresentationManifest,
  type PresentationManifestMode,
} from './build/presentationManifest'

const themeLayerDir = dirname(fileURLToPath(import.meta.url))
const upstreamThemeCss = resolvePath(themeLayerDir, 'app/assets/css/main.css')
const appConfigTypes = resolvePath(themeLayerDir, 'app/types/app-config.d.ts')
const compatibilitySafelistCss = resolvePath(
  themeLayerDir,
  'app/assets/css/safelist.inline.css',
)
const stirImageDelivery = process.env.STIR_IMAGE_DELIVERY === 'nuxt'
  ? 'nuxt'
  : 'drupal'

function hasCssEntry(entries: unknown[], path: string): boolean {
  return entries.some((entry) => {
    if (typeof entry === 'string') {
      return entry === path
    }

    return false
  })
}

export default defineNuxtConfig({
  modules: [
    ...(stirImageDelivery === 'nuxt' ? ['@nuxt/image'] : []),
    function registerStirAppConfigTypes() {
      addTypeTemplate({
        filename: 'types/stir-app-config.d.ts',
        getContents: () => readFileSync(appConfigTypes, 'utf8'),
      })
    },
  ],
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
