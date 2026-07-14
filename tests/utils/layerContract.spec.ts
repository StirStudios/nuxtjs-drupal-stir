import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const rootDir = resolve(__dirname, '../..')

describe('layer contract', () => {
  it('keeps required layer extends order in nuxt config', () => {
    const nuxtConfig = readFileSync(resolve(rootDir, 'nuxt.config.ts'), 'utf8')

    expect(nuxtConfig).toContain('extends: [\'./layers/core\', \'./layers/theme\', \'./layers/auth\']')
  })

  it('keeps the established public layer aliases available', () => {
    const nuxtConfig = readFileSync(resolve(rootDir, 'nuxt.config.ts'), 'utf8')
    const tsConfig = readFileSync(resolve(rootDir, 'tsconfig.json'), 'utf8')

    expect(nuxtConfig).toContain('\'~/utils\':')
    expect(nuxtConfig).toContain('\'~/composables\':')
    expect(nuxtConfig).toContain('\'~/components\':')
    expect(nuxtConfig).toContain('\'~/types\':')
    expect(tsConfig).toContain('"~/utils/*"')
    expect(tsConfig).toContain('"~/composables/*"')
    expect(tsConfig).toContain('"~/components/*"')
    expect(tsConfig).toContain('"~/types/*"')
  })

  it('uses the consumer CSS entry once when one is present', () => {
    const themeConfig = readFileSync(
      resolve(rootDir, 'layers/theme/nuxt.config.ts'),
      'utf8',
    )

    expect(themeConfig).toContain(
      'existsSync(appThemeCss) ? appThemeCss : upstreamThemeCss',
    )
    expect(themeConfig).toContain('nuxt.options.css.push(themeCss)')
  })

  it('owns the Drupal CE proxy boundary without changing its routes', () => {
    const coreConfig = readFileSync(
      resolve(rootDir, 'layers/core/nuxt.config.ts'),
      'utf8',
    )

    expect(coreConfig).toContain('\'nitro:config\'')
    expect(coreConfig).toContain('\'/api/drupal-ce/**\'')
    expect(coreConfig).toContain('\'/api/menu/**\'')
    expect(coreConfig).toContain('\'/dist/runtime/server/api/\'')
    expect(existsSync(resolve(
      rootDir,
      'layers/core/server/api/drupal-ce/[...].ts',
    ))).toBe(true)
    expect(existsSync(resolve(
      rootDir,
      'layers/core/server/api/drupal-ce/index.ts',
    ))).toBe(true)
    expect(existsSync(resolve(
      rootDir,
      'layers/core/server/api/menu/[...].ts',
    ))).toBe(true)
  })

  it('has consumer fixture for smoke testing the layer from a root app', () => {
    expect(existsSync(resolve(rootDir, 'tests/fixtures/consumer-app/nuxt.config.ts'))).toBe(true)
    expect(existsSync(resolve(rootDir, 'tests/fixtures/consumer-app/app/app.config.ts'))).toBe(true)
    expect(existsSync(resolve(rootDir, 'tests/fixtures/consumer-app/app/app.vue'))).toBe(true)
    expect(existsSync(resolve(rootDir, 'tests/fixtures/consumer-app/app/assets/css/main.css'))).toBe(true)

    const consumerCss = readFileSync(
      resolve(rootDir, 'tests/fixtures/consumer-app/app/assets/css/main.css'),
      'utf8',
    )

    expect(consumerCss).toContain(
      '@import \'@stir/base/layers/theme/app/assets/css/main\';',
    )
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

  it('keeps auth component types independent from the theme layer', () => {
    const authComponents = ['AuthCard.vue', 'AuthPage.vue'].map((file) =>
      readFileSync(
        resolve(rootDir, 'layers/auth/app/components/Auth', file),
        'utf8',
      ),
    )

    for (const component of authComponents) {
      expect(component).not.toContain('theme/app/types')
      expect(component).toContain('from \'../../types/theme\'')
    }
  })

  it('keeps admin editor dependencies out of anonymous runtime chunks', () => {
    const fieldComponents = [
      'DateTime/Select.vue',
      'Input.vue',
      'Input/Number.vue',
      'Input/Slider.vue',
      'Textarea.vue',
    ].map((file) => readFileSync(
      resolve(rootDir, 'layers/theme/app/components/Field', file),
      'utf8',
    ))

    for (const component of fieldComponents) {
      expect(component).toContain('from \'@nuxt/ui/composables/useFormField\'')
      expect(component).not.toContain('from \'@nuxt/ui/composables\'')
    }
  })

  it('schedules UserWay through the Nuxt Scripts idle-timeout trigger', () => {
    const userwayPlugin = readFileSync(
      resolve(rootDir, 'layers/theme/app/plugins/userway.client.ts'),
      'utf8',
    )

    expect(userwayPlugin).toContain('useScriptTriggerIdleTimeout')
    expect(userwayPlugin).not.toContain('requestIdleCallback')
  })
})
