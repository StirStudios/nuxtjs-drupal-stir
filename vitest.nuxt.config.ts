import { fileURLToPath } from 'node:url'
import { defineVitestConfig } from '@nuxt/test-utils/config'

const rootDir = fileURLToPath(new URL('./', import.meta.url))

export default defineVitestConfig({
  test: {
    name: 'nuxt',
    environment: 'nuxt',
    include: ['tests/nuxt/runtime/**/*.spec.ts'],
    setupFiles: ['tests/nuxt/runtime/setup.ts'],
    testTimeout: 10000,
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
