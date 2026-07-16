import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const componentDeclarations = async name => readFile(resolve(
  'tests/fixtures',
  `${name}-consumer/.nuxt/components.d.ts`,
), 'utf8')

const [minimal, full] = await Promise.all([
  componentDeclarations('minimal'),
  componentDeclarations('full'),
])

const expected = {
  minimal: [
    'layers/theme/app/components/Edit/Link.vue',
    'layers/theme/app/components/Drupal/Tabs.vue',
  ],
  full: [
    'layers/editorial/app/components/Edit/Link.vue',
    'layers/editorial/app/components/Drupal/Tabs.vue',
  ],
}

for (const [name, declarations] of Object.entries({ minimal, full })) {
  for (const component of expected[name]) {
    if (!declarations.includes(component)) {
      throw new Error(`${name} preset did not resolve ${component}`)
    }
  }
}

process.stdout.write('Preset editorial component ownership passed.\n')
