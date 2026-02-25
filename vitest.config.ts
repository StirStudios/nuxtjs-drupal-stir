import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const rootDir = fileURLToPath(new URL('./', import.meta.url))

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.spec.ts'],
    exclude: ['tests/nuxt/**/*.spec.ts'],
  },
  resolve: {
    alias: {
      '~': rootDir,
      '~~': rootDir,
    },
  },
})
