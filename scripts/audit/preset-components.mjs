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
    'layers/theme/app/components/App/Integrations.vue',
  ],
  full: [
    'layers/webform/app/components/Field/Renderer.vue',
    'layers/editorial/app/components/Edit/Link.vue',
    'layers/editorial/app/components/Drupal/Tabs.vue',
    'layers/integrations/app/components/App/Integrations.vue',
    'layers/integrations/app/components/App/Popup.vue',
    'layers/integrations/app/components/PrivacyNotice.vue',
  ],
}

for (const [name, declarations] of Object.entries({ minimal, full })) {
  for (const component of expected[name]) {
    if (!declarations.includes(component)) {
      throw new Error(`${name} preset did not resolve ${component}`)
    }
  }
}

for (const integrationComponent of [
  'layers/integrations/app/components/App/Popup.vue',
  'layers/integrations/app/components/PrivacyNotice.vue',
  'layers/integrations/app/components/global/Paragraph/Popup.vue',
]) {
  if (minimal.includes(integrationComponent)) {
    throw new Error(
      `minimal preset unexpectedly registered ${integrationComponent}`,
    )
  }
}

if (minimal.includes('layers/webform/app/components/Field/Renderer.vue')) {
  throw new Error(
    'minimal preset unexpectedly registered Webform field components',
  )
}

process.stdout.write('Preset optional component ownership passed.\n')
