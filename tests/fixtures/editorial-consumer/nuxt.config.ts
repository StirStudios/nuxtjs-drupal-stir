import { defineNuxtConfig } from 'nuxt/config'
import { fileURLToPath } from 'node:url'

// A standalone editorial composition without auth, Webform or SEO.
export default defineNuxtConfig({
  ssr: false,
  extends: [fileURLToPath(new URL('../../../layers/editorial', import.meta.url))],
})
