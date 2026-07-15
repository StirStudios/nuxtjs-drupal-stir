import { resolve } from 'node:path'
import process from 'node:process'
import { loadNuxt } from 'nuxt/kit'

const rootDir = resolve('.')

async function inspectPreset(name) {
  const nuxt = await loadNuxt({
    cwd: resolve(rootDir, 'tests/fixtures', `${name}-consumer`),
    dev: false,
    ready: true,
  })

  try {
    const layers = nuxt.options._layers.map(layer => layer.cwd.replaceAll('\\', '/'))
    const hasAuth = layers.some(layer => layer.endsWith('/layers/auth'))
    const hasWebform = layers.some(layer => layer.endsWith('/layers/webform'))
    const hasAnalytics = layers.some(layer => layer.endsWith('/layers/analytics'))
    const hasScripts = layers.some(layer => layer.endsWith('/layers/scripts'))
    const hasProtectedAccessConfig = Object.hasOwn(
      nuxt.options.runtimeConfig,
      'protectedPassword',
    )

    return {
      name,
      hasAuth,
      hasWebform,
      hasAnalytics,
      hasScripts,
      hasProtectedAccessConfig,
      layers: layers.map(layer => layer.replace(`${rootDir}/`, '')),
    }
  } finally {
    await nuxt.close()
  }
}

const minimal = await inspectPreset('minimal')
const full = await inspectPreset('full')

if (minimal.hasAuth) {
  throw new Error('The minimal preset must not load the authentication layer.')
}

if (minimal.hasProtectedAccessConfig) {
  throw new Error('The minimal preset must not load protected-access configuration.')
}

if (minimal.hasWebform) {
  throw new Error('The minimal preset must not load the Webform layer.')
}

if (minimal.hasAnalytics || minimal.hasScripts) {
  throw new Error('The minimal preset must not load analytics or scripts layers.')
}

if (!full.hasAuth) {
  throw new Error('The full preset must preserve the authentication layer.')
}

if (!full.hasProtectedAccessConfig) {
  throw new Error('The full preset must preserve protected-access configuration.')
}

if (!full.hasWebform) {
  throw new Error('The full preset must preserve the Webform layer.')
}

if (!full.hasAnalytics || !full.hasScripts) {
  throw new Error('The full preset must preserve analytics and scripts layers.')
}

process.stdout.write(`${JSON.stringify({ minimal, full }, null, 2)}\n`)
