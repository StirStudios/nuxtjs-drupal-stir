import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const rootDir = resolve(__dirname, '../..')

describe('layer contract', () => {
  it('keeps required layer extends order in nuxt config', () => {
    const nuxtConfig = readFileSync(resolve(rootDir, 'nuxt.config.ts'), 'utf8')

    expect(nuxtConfig).toContain('extends: [\'./layers/core\', \'./layers/theme\', \'./layers/auth\']')
  })

  it('keeps required aliases for layer imports', () => {
    const nuxtConfig = readFileSync(resolve(rootDir, 'nuxt.config.ts'), 'utf8')

    expect(nuxtConfig).toContain('\'~/utils\': resolveLayerPath(\'./layers/theme/app/utils\')')
    expect(nuxtConfig).toContain('\'~/composables\': resolveLayerPath(\'./layers/theme/app/composables\')')
    expect(nuxtConfig).toContain('\'~/components\': resolveLayerPath(\'./layers/theme/app/components\')')
    expect(nuxtConfig).toContain('\'~/types\': resolveLayerPath(\'./types\')')
  })

  it('has consumer fixture for smoke testing the layer from a root app', () => {
    expect(existsSync(resolve(rootDir, 'tests/fixtures/consumer-app/nuxt.config.ts'))).toBe(true)
    expect(existsSync(resolve(rootDir, 'tests/fixtures/consumer-app/app/app.vue'))).toBe(true)
  })
})
