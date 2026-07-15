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
