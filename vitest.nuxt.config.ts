import { fileURLToPath } from 'node:url'
import { defineVitestConfig } from '@nuxt/test-utils/config'

const rootDir = fileURLToPath(new URL('./', import.meta.url))

export default defineVitestConfig({
  test: {
    name: 'nuxt',
    environment: 'nuxt',
    include: ['tests/nuxt/runtime/**/*.spec.ts'],
    setupFiles: ['tests/nuxt/runtime/setup.ts'],
    environmentOptions: {
      nuxt: {
        rootDir,
        overrides: {
          modules: [],
        },
      },
    },
  },
})
