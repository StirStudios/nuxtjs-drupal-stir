import { defineNuxtConfig } from 'nuxt/config'
import { fileURLToPath } from 'node:url'

const authLayer = fileURLToPath(
  new URL('../../../layers/auth', import.meta.url),
)

// The auth layer's forms with the real Turnstile widget and no Drupal, for
// tests/nuxt/e2e/turnstile.e2e.spec.ts.
export default defineNuxtConfig({
  extends: [authLayer],
})
