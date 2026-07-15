import { fileURLToPath } from 'node:url'

const rootLayer = fileURLToPath(new URL('../../..', import.meta.url))

export default defineNuxtConfig({
  alias: {
    '@stir/base': rootLayer,
  },
  extends: [`${rootLayer}/presets/minimal`],
})
