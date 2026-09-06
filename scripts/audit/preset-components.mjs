import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

export async function assertPresetComponents(consumerDir, preset) {
  const components = await readFile(resolve(consumerDir, '.nuxt/components.d.ts'), 'utf8')
  const imports = await readFile(resolve(consumerDir, '.nuxt/imports.d.ts'), 'utf8')
  const minimal = preset === 'minimal'
  const expected = [
    `layers/${minimal ? 'theme' : 'editorial'}/app/components/Edit/Link.vue`,
    `layers/${minimal ? 'theme' : 'editorial'}/app/components/Drupal/Tabs.vue`,
    `layers/${minimal ? 'theme' : 'integrations'}/app/components/App/Integrations.vue`,
  ]

  for (const path of expected) {
    if (!components.includes(path)) throw new Error(`${preset} did not resolve ${path}`)
  }
  for (const path of [
    'layers/webform/app/components/Field/Renderer.vue',
    'layers/integrations/app/components/App/Popup.vue',
    'layers/integrations/app/components/PrivacyNotice.vue',
  ]) {
    if (components.includes(path) === minimal) throw new Error(`${preset} has incorrect optional component ownership: ${path}`)
  }
  for (const name of ['useEvaluateState', 'useStirWebformTheme', 'buildValidationSchema']) {
    if (imports.includes(name) === minimal) throw new Error(`${preset} has incorrect optional import ownership: ${name}`)
  }
}

if (import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  for (const preset of ['minimal', 'full']) {
    await assertPresetComponents(resolve('tests/fixtures', `${preset}-consumer`), preset)
  }
  console.log('Preset optional component ownership passed.')
}
