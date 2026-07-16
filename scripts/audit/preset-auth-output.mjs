import { readdir } from 'node:fs/promises'
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

process.stdout.write(`${JSON.stringify({ routes, unexpectedRoutes }, null, 2)}\n`)
