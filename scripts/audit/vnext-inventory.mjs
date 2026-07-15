import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const output = resolve(root, 'docs/vnext/current-inventory.json')

function normalize(path) {
  return path.replaceAll('\\', '/')
}

function walk(path, predicate = () => true) {
  if (!existsSync(path)) return []

  const files = []

  for (const entry of readdirSync(path).sort()) {
    if (['.git', '.nuxt', '.output', 'coverage', 'node_modules'].includes(entry)) {
      continue
    }

    const absolute = resolve(path, entry)

    if (statSync(absolute).isDirectory()) {
      files.push(...walk(absolute, predicate))
    } else if (predicate(absolute)) {
      files.push(normalize(relative(root, absolute)))
    }
  }

  return files
}

function layerFiles(segment, extensions) {
  return walk(resolve(root, 'layers'), file => {
    const normalized = normalize(file)
    return normalized.includes(`/app/${segment}/`)
      && extensions.some(extension => normalized.endsWith(extension))
  })
}

function serverRoute(path) {
  const match = path.match(/(?:^|\/)server\/(api|routes)\/(.+)\.(?:get|post|put|patch|delete|options|head)?\.?ts$/)

  if (!match) return null

  const prefix = match[1] === 'api' ? '/api' : ''
  let route = match[2]
    .replace(/\.(?:get|post|put|patch|delete|options|head)$/, '')
    .replace(/\/index$/, '')
    .replace(/\[\.\.\.[^\]]*\]/g, '**')
    .replace(/\[(.+?)\]/g, ':$1')

  route = `${prefix}/${route}`.replace(/\/$/, '')
  return route || '/'
}

function countByPrefix(files, pattern) {
  return Object.fromEntries(
    [...new Set(files.map(file => file.match(pattern)?.[1]).filter(Boolean))]
      .sort()
      .map(key => [key, files.filter(file => file.match(pattern)?.[1] === key).length]),
  )
}

const packageJson = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'))
const components = layerFiles('components', ['.vue'])
const composables = layerFiles('composables', ['.ts', '.js'])
const utils = layerFiles('utils', ['.ts', '.js'])
const plugins = layerFiles('plugins', ['.ts', '.js'])
const middleware = layerFiles('middleware', ['.ts', '.js'])
const serverFiles = walk(root, file => normalize(file).includes('/server/') && /\.(?:ts|js)$/.test(file))
const routes = [...new Set(serverFiles.map(serverRoute).filter(Boolean))].sort()
const tests = walk(resolve(root, 'tests'), file => /\.(?:spec|test)\.(?:ts|js|mjs)$/.test(file))
const layers = existsSync(resolve(root, 'layers'))
  ? readdirSync(resolve(root, 'layers'))
      .filter(name => statSync(resolve(root, 'layers', name)).isDirectory())
      .sort()
  : []
const publicContractsPath = resolve(root, 'docs/public-contracts.json')
const perfPath = resolve(root, 'docs/perf-report.latest.json')
const performanceReport = existsSync(perfPath)
  ? JSON.parse(readFileSync(perfPath, 'utf8'))
  : null

const inventory = {
  schemaVersion: 1,
  package: {
    name: packageJson.name,
    version: packageJson.version,
    packageManager: packageJson.packageManager,
    engines: packageJson.engines,
  },
  layers,
  dependencies: {
    production: Object.keys(packageJson.dependencies ?? {}).sort(),
    development: Object.keys(packageJson.devDependencies ?? {}).sort(),
  },
  scripts: Object.keys(packageJson.scripts ?? {}).sort(),
  registrationSurface: {
    components,
    composables,
    utils,
    plugins,
    middleware,
    serverRoutes: routes,
  },
  counts: {
    components: components.length,
    composables: composables.length,
    utils: utils.length,
    plugins: plugins.length,
    middleware: middleware.length,
    serverRoutes: routes.length,
    productionDependencies: Object.keys(packageJson.dependencies ?? {}).length,
    developmentDependencies: Object.keys(packageJson.devDependencies ?? {}).length,
    tests: tests.length,
    testsByArea: countByPrefix(tests, /^tests\/([^/]+)/),
  },
  tests,
  documentedPublicContract: existsSync(publicContractsPath)
    ? JSON.parse(readFileSync(publicContractsPath, 'utf8'))
    : null,
  performanceBaseline: performanceReport
    ? {
        schemaVersion: performanceReport.schemaVersion,
        initialClient: {
          sizeKb: performanceReport.initialClient?.sizeKb,
          gzipKb: performanceReport.initialClient?.gzipKb,
          assets: performanceReport.initialClient?.assets,
        },
        totalOutputSize: performanceReport.totalOutputSize,
        topClientChunks: performanceReport.topClientChunks,
      }
    : null,
}

writeFileSync(output, `${JSON.stringify(inventory, null, 2)}\n`)
console.log(`Wrote ${normalize(relative(root, output))}`)
