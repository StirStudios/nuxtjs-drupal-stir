import { defineNuxtConfig } from 'nuxt/config'
import { fileURLToPath } from 'node:url'

const layer = (name: string) => fileURLToPath(
  new URL(`../../../layers/${name}`, import.meta.url),
)

// Mirrors a non-indexed application: individual capability layers, no SEO or
// analytics layers, and client-side rendering.
export default defineNuxtConfig({
  ssr: false,
  extends: [layer('auth'), layer('webform'), layer('editorial')],
})
