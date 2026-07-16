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
      '#stir/utils': fileURLToPath(
        new URL('./layers/theme/app/utils', import.meta.url),
      ),
      '#stir-webform/utils': fileURLToPath(
        new URL('./layers/webform/app/utils', import.meta.url),
      ),
      '#stir-webform/composables': fileURLToPath(
        new URL('./layers/webform/app/composables', import.meta.url),
      ),
    },
  },
})
