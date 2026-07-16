import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repositoryDir = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

type AnalysisOutputOptions = { dir?: string }
type AnalysisOutputChunk = {
  type: 'chunk'
  isEntry: boolean
  fileName: string
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

        const entries = Object.values(bundle)
          .filter((asset): asset is AnalysisOutputChunk =>
            asset.type === 'chunk' && asset.isEntry,
          )
          .map(chunk => ({
            fileName: chunk.fileName,
            modules: Object.entries(chunk.modules)
              .map(([id, details]) => ({
                id,
                renderedBytes: details.renderedLength,
              }))
              .sort((left, right) => right.renderedBytes - left.renderedBytes),
          }))

        if (!entries.length) return

        const auditDir = resolve(repositoryDir, '.audit')

        mkdirSync(auditDir, { recursive: true })
        writeFileSync(
          resolve(auditDir, 'client-entry-modules.json'),
          `${JSON.stringify({ entries }, null, 2)}\n`,
        )
      },
    }],
  },
})
