import { fileURLToPath } from 'node:url'
import { defineVitestConfig } from '@nuxt/test-utils/config'

const rootDir = fileURLToPath(new URL('./', import.meta.url))
const fatalNuxtLogPatterns = [
  /\[nuxt\] Error in `vue:setup`/i,
  /\[nuxt\] error caught during app initialization/i,
  /Unhandled error during execution of setup function/i,
  /Hydration (?:completed but contains mismatches|node mismatch|children mismatch)/i,
]

export default defineVitestConfig({
  test: {
    name: 'nuxt',
    environment: 'nuxt',
    include: ['tests/nuxt/runtime/**/*.spec.ts'],
    setupFiles: ['tests/nuxt/runtime/setup.ts'],
    testTimeout: 10000,
    // Each file boots a Nuxt app in a beforeAll hook. On a busy machine that
    // can outlast Vitest's 10 s hook default although no test is slow; the
    // tests themselves keep the 10 s limit.
    hookTimeout: 60000,
    onConsoleLog(log, type) {
      if (
        type === 'stderr'
        && fatalNuxtLogPatterns.some(pattern => pattern.test(log))
      ) {
        throw new Error(`Fatal Nuxt runtime diagnostic:\n${log}`)
      }
    },
    environmentOptions: {
      nuxt: {
        rootDir,
      },
    },
  },
})
