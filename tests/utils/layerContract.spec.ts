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

  it('publishes a machine-readable compatibility contract', () => {
    const contract = JSON.parse(readFileSync(
      resolve(rootDir, 'docs/public-contracts.json'),
      'utf8',
    )) as {
      compatibilityPolicy: string
      aliases: string[]
      serverRoutes: string[]
      runtimeConfigEnvironment: string[]
    }

    expect(contract.compatibilityPolicy).toBe('preserve-within-major')
    expect(contract.aliases).toEqual([
      '~/utils',
      '~/composables',
      '~/components',
      '~/types',
    ])
    expect(contract.serverRoutes).toContain('/api/drupal-ce/**')
    expect(contract.serverRoutes).toContain('/api/auth/**')
    expect(contract.runtimeConfigEnvironment).toContain('DRUPAL_URL')
    expect(contract.runtimeConfigEnvironment).toContain('TURNSTILE_SECRET')
  })

  it('exposes the root Nuxt config as the package entry point', () => {
    const packageJson = JSON.parse(readFileSync(
      resolve(rootDir, 'package.json'),
      'utf8',
    )) as { main?: string }

    expect(packageJson.main).toBe('./nuxt.config.ts')
  })

  it('keeps the consumer audit matrix outside downstream repositories', () => {
    const targets = JSON.parse(readFileSync(
      resolve(rootDir, 'scripts/audit/consumer-targets.json'),
      'utf8',
    )) as { targets: Record<string, { routes: string[] }> }
    const consumerScript = readFileSync(
      resolve(rootDir, 'scripts/audit/consumers.mjs'),
      'utf8',
    )

    expect(Object.keys(targets.targets)).toEqual([
      'laamada',
      'piper',
      'danceplug',
      'stir',
    ])
    expect(targets.targets.danceplug?.routes).toContain('/videos')
    expect(consumerScript).toContain('\'archive\'')
    expect(consumerScript).toContain('mkdtemp(join(tmpdir(), \'stir-consumers-\'))')
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

  it('does not load the reveal renderer for static paragraph text', () => {
    const paragraphText = readFileSync(
      resolve(rootDir, 'layers/theme/app/components/global/Paragraph/Text.vue'),
      'utf8',
    )

    expect(paragraphText).toContain('const hasRevealMotion = computed')
    expect(paragraphText).toContain('<LazyRevealMotion')
    expect(paragraphText).toContain('v-if="hasRevealMotion"')
    expect(paragraphText).toContain('v-else')
  })

  it('registers video iframes explicitly without subscriber polling', () => {
    const videoPlayers = readFileSync(
      resolve(rootDir, 'layers/theme/app/composables/useVideoPlayers.ts'),
      'utf8',
    )
    const mediaVideo = readFileSync(
      resolve(rootDir, 'layers/theme/app/components/global/Media/Video.vue'),
      'utf8',
    )

    expect(videoPlayers).toContain('async function registerIframe')
    expect(videoPlayers).toContain('registryVersion')
    expect(videoPlayers).not.toContain('setInterval(bind')
    expect(mediaVideo).toContain('ref="iframeElement"')
    expect(mediaVideo).toContain('registerIframe(iframeElement.value)')
  })

  it('keeps production icons on demand and component-test icons bundled', () => {
    const nuxtConfig = readFileSync(resolve(rootDir, 'nuxt.config.ts'), 'utf8')

    expect(nuxtConfig).toContain('...(isTestEnv ? { provider: \'none\' as const } : {})')
    expect(nuxtConfig).toContain('clientBundle: isTestEnv')
    expect(nuxtConfig).toContain('scan: false')
  })

  it('enforces stable initial and deferred bundle budgets', () => {
    const budget = JSON.parse(readFileSync(
      resolve(rootDir, 'docs/perf-budget.json'),
      'utf8',
    )) as Record<string, number>

    expect(budget.maxInitialJavascriptGzipKb).toBeLessThan(160)
    expect(budget.maxInitialCssGzipKb).toBeLessThanOrEqual(36)
    expect(budget.maxAdminDeferredGzipKb).toBeLessThanOrEqual(170)
  })

  it('schedules UserWay through the Nuxt Scripts idle-timeout trigger', () => {
    const userwayPlugin = readFileSync(
      resolve(rootDir, 'layers/theme/app/plugins/userway.client.ts'),
      'utf8',
    )

    expect(userwayPlugin).toContain('useScriptTriggerIdleTimeout')
    expect(userwayPlugin).toContain('warmupStrategy: false')
    expect(userwayPlugin).not.toContain('requestIdleCallback')
  })
})
