import { fileURLToPath } from 'node:url'

const platformLayer = fileURLToPath(
  new URL('../../../layers/platform', import.meta.url),
)
const authLayer = fileURLToPath(
  new URL('../../../layers/auth', import.meta.url),
)

export default defineNuxtConfig({
  extends: [platformLayer, authLayer],
})
