import { fileURLToPath } from 'node:url'

const platformLayer = fileURLToPath(
  new URL('../../layers/platform', import.meta.url),
)

export default defineNuxtConfig({
  extends: [platformLayer],
})
