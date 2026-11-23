import { defineNuxtConfig } from 'nuxt/config'
import { fileURLToPath } from 'node:url'

const rootLayer = fileURLToPath(new URL('../../..', import.meta.url))

// The full preset with a probe outside the page, for the navigation e2e.
export default defineNuxtConfig({
  alias: {
    '@stir/base': rootLayer,
  },
  extends: [`${rootLayer}/presets/full`],
})
