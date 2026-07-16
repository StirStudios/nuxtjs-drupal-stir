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
    const layers = nuxt.options._layers.map((layer) =>
      layer.cwd.replaceAll('\\', '/'),
    )
    const hasAuth = layers.some((layer) => layer.endsWith('/layers/auth'))
    const hasWebform = layers.some((layer) => layer.endsWith('/layers/webform'))
    const hasTurnstile = layers.some((layer) =>
      layer.endsWith('/layers/turnstile'),
    )
    const hasAnalytics = layers.some((layer) =>
      layer.endsWith('/layers/analytics'),
    )
    const hasScripts = layers.some((layer) => layer.endsWith('/layers/scripts'))
    const hasEditorial = layers.some((layer) =>
      layer.endsWith('/layers/editorial'),
    )
    const hasIntegrations = layers.some((layer) =>
      layer.endsWith('/layers/integrations'),
    )
    const hasProtectedAccessConfig = Object.hasOwn(
      nuxt.options.runtimeConfig,
      'protectedPassword',
    )
    return {
      name,
      hasAuth,
      hasWebform,
      hasTurnstile,
      hasAnalytics,
      hasScripts,
      hasEditorial,
      hasIntegrations,
      hasProtectedAccessConfig,
      layers: layers.map((layer) => layer.replace(`${rootDir}/`, '')),
    }
  } finally {
    await nuxt.close()
  }
}

const minimal = await inspectPreset('minimal')
const full = await inspectPreset('full')
const auth = await inspectPreset('auth')
const webform = await inspectPreset('webform')

if (minimal.hasAuth) {
  throw new Error('The minimal preset must not load the authentication layer.')
}

if (minimal.hasProtectedAccessConfig) {
  throw new Error(
    'The minimal preset must not load protected-access configuration.',
  )
}

if (minimal.hasWebform) {
  throw new Error('The minimal preset must not load the Webform layer.')
}

if (minimal.hasTurnstile) {
  throw new Error('The minimal preset must not load the Turnstile layer.')
}

if (minimal.hasAnalytics || minimal.hasScripts) {
  throw new Error(
    'The minimal preset must not load analytics or scripts layers.',
  )
}

if (minimal.hasEditorial) {
  throw new Error('The minimal preset must not load the editorial layer.')
}

if (minimal.hasIntegrations) {
  throw new Error('The minimal preset must not load the integrations layer.')
}

if (!full.hasAuth) {
  throw new Error('The full preset must preserve the authentication layer.')
}

if (!full.hasProtectedAccessConfig) {
  throw new Error(
    'The full preset must preserve protected-access configuration.',
  )
}

if (!full.hasWebform) {
  throw new Error('The full preset must preserve the Webform layer.')
}

if (!full.hasTurnstile) {
  throw new Error('The full preset must preserve the Turnstile layer.')
}

if (!full.hasAnalytics || !full.hasScripts) {
  throw new Error('The full preset must preserve analytics and scripts layers.')
}

if (!full.hasEditorial) {
  throw new Error('The full preset must preserve the editorial layer.')
}

if (!full.hasIntegrations) {
  throw new Error('The full preset must preserve the integrations layer.')
}

if (!auth.hasAuth || auth.hasWebform || !auth.hasTurnstile) {
  throw new Error(
    'The auth fixture must load Turnstile without loading Webforms.',
  )
}

if (!webform.hasWebform || webform.hasAuth || !webform.hasTurnstile) {
  throw new Error(
    'The Webform fixture must load Turnstile without loading auth.',
  )
}

process.stdout.write(
  `${JSON.stringify({ minimal, full, auth, webform }, null, 2)}\n`,
)
