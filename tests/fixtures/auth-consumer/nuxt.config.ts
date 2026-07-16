import { fileURLToPath } from 'node:url'

const authLayer = fileURLToPath(
  new URL('../../../layers/auth', import.meta.url),
)

export default defineNuxtConfig({
  extends: [authLayer],
})
