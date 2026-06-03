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

  it('exposes auth config and validation helpers from public layer paths', () => {
    expect(existsSync(resolve(rootDir, 'layers/auth/app/composables/useAuthConfig.ts'))).toBe(true)

    const authConfigComposable = readFileSync(
      resolve(rootDir, 'layers/auth/app/composables/useAuthConfig.ts'),
      'utf8',
    )
    const authValidation = readFileSync(
      resolve(rootDir, 'layers/auth/app/utils/authValidation.ts'),
      'utf8',
    )

    expect(authConfigComposable).toContain('export { useAuthConfig }')
    expect(authValidation).toContain('export function createLoginValidationSchema')
    expect(authValidation).toContain('export function createPasswordRequestValidationSchema')
    expect(authValidation).toContain('export function createRegisterValidationSchema')
    expect(authValidation).toContain('export function createPasswordResetValidationSchema')
    expect(authValidation).toContain('export function createAccountPasswordChangeValidationSchema')
  })
})
