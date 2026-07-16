import { fileURLToPath } from 'node:url'

const compatibilityLayer = fileURLToPath(new URL('../..', import.meta.url))

export default defineNuxtConfig({
  extends: [compatibilityLayer],
})
