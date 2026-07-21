import { readFile, readdir } from 'node:fs/promises'
import { resolve } from 'node:path'

const output = resolve('tests/fixtures/auth-consumer/.output/server/chunks/routes/api')
const files = await readdir(output, { recursive: true })
const routes = files
  .filter(file => file.endsWith('.mjs'))
  .map(file => file.replaceAll('\\', '/'))
  .sort()
const unexpectedRoutes = routes.filter(route =>
  !route.startsWith('auth/') && !route.startsWith('account/'),
)
const imports = await readFile(
  resolve('tests/fixtures/auth-consumer/.nuxt/imports.d.ts'),
  'utf8',
)
const validationImport = imports
  .split('\n')
  .find(line => line.includes('useValidation'))

if (unexpectedRoutes.length > 0) {
  throw new Error(
    `Standalone auth output contains website routes: ${unexpectedRoutes.join(', ')}`,
  )
}

if (!routes.some(route => route.startsWith('auth/'))) {
  throw new Error('Standalone auth output is missing auth API routes.')
}

if (!routes.some(route => route.startsWith('account/'))) {
  throw new Error('Standalone auth output is missing account API routes.')
}

if (!validationImport?.includes('/layers/foundation/app/composables/useValidation')) {
  throw new Error(
    'Standalone auth does not resolve useValidation from the shared foundation.',
  )
}

process.stdout.write(`${JSON.stringify({
  routes,
  unexpectedRoutes,
  validationImport: validationImport.trim(),
}, null, 2)}\n`)
