import { fileURLToPath } from 'node:url'

const platformLayer = fileURLToPath(
  new URL('../../../layers/platform', import.meta.url),
)
const webformLayer = fileURLToPath(
  new URL('../../../layers/webform', import.meta.url),
)

export default defineNuxtConfig({
  extends: [platformLayer, webformLayer],
})
