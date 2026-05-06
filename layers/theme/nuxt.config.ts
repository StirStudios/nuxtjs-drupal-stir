import { dirname, resolve as resolvePath } from 'node:path'
import { fileURLToPath } from 'node:url'

const themeLayerDir = dirname(fileURLToPath(import.meta.url))

export default defineNuxtConfig({
  css: [resolvePath(themeLayerDir, 'app/assets/css/main.css')],
})
