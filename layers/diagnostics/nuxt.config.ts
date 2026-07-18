import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repositoryDir = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

type AnalysisOutputOptions = { dir?: string }
type AnalysisOutputChunk = {
  type: 'chunk'
  isEntry: boolean
  isDynamicEntry: boolean
  fileName: string
  facadeModuleId: string | null
  imports: string[]
  dynamicImports: string[]
  modules: Record<string, { renderedLength: number }>
}
type AnalysisOutputAsset = { type: 'asset' }
type AnalysisOutputBundle = Record<
  string,
  AnalysisOutputChunk | AnalysisOutputAsset
>

export default defineNuxtConfig({
  vite: {
    plugins: [{
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
            imports: chunk.imports,
            dynamicImports: chunk.dynamicImports,
            modules: Object.entries(chunk.modules)
              .map(([id, details]) => ({
                id,
                renderedBytes: details.renderedLength,
              }))
              .sort((left, right) => right.renderedBytes - left.renderedBytes),
          }))

        if (!chunks.length) return

        const auditDir = resolve(repositoryDir, '.audit')

        mkdirSync(auditDir, { recursive: true })
        writeFileSync(
          resolve(auditDir, 'client-entry-modules.json'),
          `${JSON.stringify({ chunks }, null, 2)}\n`,
        )
      },
    }],
  },
})
