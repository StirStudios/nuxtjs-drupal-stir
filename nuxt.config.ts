import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = dirname(fileURLToPath(import.meta.url))
const enableWorkspaceDiagnostics =
  process.env.STIR_PERF_ANALYZE === 'true'
  && resolve(process.cwd()) === resolve(rootDir)

export default defineNuxtConfig({
  extends: [
    './layers/platform',
    ...(enableWorkspaceDiagnostics ? ['./layers/diagnostics'] : []),
    './layers/editorial',
    './layers/integrations',
    './layers/analytics',
    './layers/scripts',
    './layers/webform',
    './layers/auth',
  ],
})
