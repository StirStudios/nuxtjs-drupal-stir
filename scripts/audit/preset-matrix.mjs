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

    return {
      name,
      hasAuth,
      hasWebform,
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

if (minimal.hasWebform) {
  throw new Error('The minimal preset must not load the Webform layer.')
}

if (!full.hasAuth) {
  throw new Error('The full preset must preserve the authentication layer.')
}

if (!full.hasWebform) {
  throw new Error('The full preset must preserve the Webform layer.')
}

process.stdout.write(`${JSON.stringify({ minimal, full }, null, 2)}\n`)
