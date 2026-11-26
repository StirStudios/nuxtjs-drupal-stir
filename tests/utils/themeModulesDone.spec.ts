import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { loadNuxt } from '@nuxt/kit'

const rootDir = resolve(__dirname, '../..')

// What the theme layer's modules:done hook leaves on a site's config, with
// its modules run and nothing built.
async function themeResult(fixture: string) {
  const nuxt = await loadNuxt({ cwd: resolve(rootDir, 'tests/fixtures', fixture), ready: true, dev: false })

  try {
    return {
      themeCss: nuxt.options.css.map(String).filter(entry => entry.endsWith('/main.css')),
      presentationBuild: nuxt.options.runtimeConfig.public.stirPresentationBuild as
        { sourceRevision?: unknown, utilityCount?: unknown } | undefined,
    }
  }
  finally {
    await nuxt.close()
  }
}

describe('theme layer modules:done', () => {
  it('uses a site\'s own CSS entry once instead of the layer\'s', async () => {
    const { themeCss } = await themeResult('consumer-app')

    expect(themeCss).toEqual([resolve(rootDir, 'tests/fixtures/consumer-app/app/assets/css/main.css')])
  }, 60_000)

  it('falls back to the layer\'s CSS entry for a site without one', async () => {
    const { themeCss } = await themeResult('webform-consumer')

    expect(themeCss).toEqual([resolve(rootDir, 'layers/theme/app/assets/css/main.css')])
  }, 60_000)

  it('records the presentation build in public runtime config before Nitro reads it', async () => {
    const { presentationBuild } = await themeResult('consumer-app')

    expect(presentationBuild?.sourceRevision).toMatch(/^[0-9a-f]{64}$/)
    expect(presentationBuild?.utilityCount).toBeGreaterThan(0)
  }, 60_000)
})
