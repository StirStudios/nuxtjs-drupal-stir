import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'e2e',
    environment: 'node',
    include: ['tests/nuxt/e2e/**/*.spec.ts'],
    globalSetup: ['tests/nuxt/e2e/support/prepareFixtures.ts'],
    // Each file runs a full Nuxt build; run them one at a time locally.
    fileParallelism: Boolean(process.env.CI),
  },
})
