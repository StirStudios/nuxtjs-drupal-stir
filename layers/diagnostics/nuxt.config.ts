import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

type AnalysisOutputOptions = { dir?: string }
type AnalysisOutputChunk = {
  type: 'chunk'
  isEntry: boolean
  isDynamicEntry: boolean
  fileName: string
  facadeModuleId: string | null
  imports: string[]
  viteMetadata?: { importedCss?: Set<string> }
  dynamicImports: string[]
  modules: Record<string, { renderedLength: number }>
}
type AnalysisOutputAsset = { type: 'asset' }
type AnalysisOutputBundle = Record<
  string,
  AnalysisOutputChunk | AnalysisOutputAsset
>

export default defineNuxtConfig({
  modules: [(_options, nuxt) => {
    const auditDir = resolve(nuxt.options.rootDir, '.audit')

    nuxt.options.vite.plugins ||= []
    nuxt.options.vite.plugins.push({
      apply: 'build',
      name: 'stir-client-entry-analysis',
      generateBundle(
        options: AnalysisOutputOptions,
        bundle: AnalysisOutputBundle,
      ) {
        if (!String(options.dir || '').includes('/client')) return

        const chunks = Object.values(bundle)
          .filter((asset): asset is AnalysisOutputChunk => asset.type === 'chunk')
          .map(chunk => ({
            fileName: chunk.fileName,
            facadeModuleId: chunk.facadeModuleId,
            isEntry: chunk.isEntry,
            isDynamicEntry: chunk.isDynamicEntry,
            imports: [...chunk.imports, ...Array.from(chunk.viteMetadata?.importedCss || [])],
            dynamicImports: chunk.dynamicImports,
            modules: Object.entries(chunk.modules)
              .map(([id, details]) => ({
                id,
                renderedBytes: details.renderedLength,
              }))
              .sort((left, right) => right.renderedBytes - left.renderedBytes),
          }))

        if (!chunks.length) return

        mkdirSync(auditDir, { recursive: true })
        writeFileSync(
          resolve(auditDir, 'client-entry-modules.json'),
          `${JSON.stringify({ chunks }, null, 2)}\n`,
        )
      },
    })
  }],
})
