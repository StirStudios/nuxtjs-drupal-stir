import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const rootDir = resolve(__dirname, '../..')

describe('layer contract', () => {
  it('composes the compatibility root from explicit capability layers', () => {
    const nuxtConfig = readFileSync(resolve(rootDir, 'nuxt.config.ts'), 'utf8')
    const platformConfig = readFileSync(
      resolve(rootDir, 'layers/platform/nuxt.config.ts'),
      'utf8',
    )

    for (const layer of [
      'platform',
      'editorial',
      'integrations',
      'analytics',
      'scripts',
      'webform',
      'auth',
    ]) {
      expect(nuxtConfig).toContain(`'./layers/${layer}'`)
    }
    expect(platformConfig).toContain(
      'extends: [\'../core\', \'../theme\']',
    )
    expect(platformConfig).not.toContain('../editorial')
    expect(existsSync(resolve(
      rootDir,
      'layers/editorial/app/components/Drupal/Tabs.vue',
    ))).toBe(true)
    expect(existsSync(resolve(
      rootDir,
      'layers/editorial/app/components/Edit/Link.vue',
    ))).toBe(true)
  })

  it('keeps repository report writers out of published consumer layers', () => {
    const rootConfig = readFileSync(resolve(rootDir, 'nuxt.config.ts'), 'utf8')
    const platformConfig = readFileSync(
      resolve(rootDir, 'layers/platform/nuxt.config.ts'),
      'utf8',
    )
    const diagnosticsConfig = readFileSync(
      resolve(rootDir, 'layers/diagnostics/nuxt.config.ts'),
      'utf8',
    )

    expect(platformConfig).not.toContain('stir-client-entry-analysis')
    expect(platformConfig).not.toContain('client-entry-modules.json')
    expect(diagnosticsConfig).toContain('stir-client-entry-analysis')
    expect(diagnosticsConfig).toContain('client-entry-modules.json')
    expect(rootConfig).toContain('process.env.STIR_PERF_ANALYZE === \'true\'')
    expect(rootConfig).toContain('resolve(process.cwd()) === resolve(rootDir)')
    expect(rootConfig).toContain('\'./layers/diagnostics\'')
  })

  it('prefers Stir-owned aliases while keeping compatibility aliases available', () => {
    const nuxtConfig = readFileSync(
      resolve(rootDir, 'layers/platform/nuxt.config.ts'),
      'utf8',
    )
    const tsConfig = readFileSync(resolve(rootDir, 'tsconfig.json'), 'utf8')

    for (const alias of ['utils', 'composables', 'components', 'types']) {
      expect(nuxtConfig).toContain(`'#stir/${alias}':`)
      expect(nuxtConfig).toContain(`'~/${alias}':`)
      expect(tsConfig).toContain(`"#stir/${alias}/*"`)
      expect(tsConfig).toContain(`"~/${alias}/*"`)
    }
  })

  it('publishes a machine-readable compatibility contract', () => {
    const contract = JSON.parse(readFileSync(
      resolve(rootDir, 'docs/public-contracts.json'),
      'utf8',
    )) as {
      compatibilityPolicy: string
      aliases: string[]
      preferredAliases: string[]
      compatibilityAliases: string[]
      serverRoutes: string[]
      publicComposables: string[]
      runtimeConfigEnvironment: string[]
    }

    expect(contract.compatibilityPolicy).toBe('preserve-within-major')
    expect(contract.aliases).toEqual([
      '#stir/utils',
      '#stir/composables',
      '#stir/components',
      '#stir/types',
      '~/utils',
      '~/composables',
      '~/components',
      '~/types',
    ])
    expect(contract.preferredAliases).toEqual([
      '#stir/utils',
      '#stir/composables',
      '#stir/components',
      '#stir/types',
    ])
    expect(contract.compatibilityAliases).toEqual([
      '~/utils',
      '~/composables',
      '~/components',
      '~/types',
    ])
    expect(contract.serverRoutes).toContain('/api/drupal-ce/**')
    expect(contract.serverRoutes).toContain('/api/listings/:listing')
    expect(contract.serverRoutes).toContain('/api/auth/**')
    expect(contract.publicComposables).toContain('useStirListing')
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

  it('documents one installed package as the downstream layer source', () => {
    const readme = readFileSync(resolve(rootDir, 'readme.md'), 'utf8')

    expect(readme).toContain('"@stir/base": "github:StirStudios/nuxtjs-drupal-stir#vnext"')
    expect(readme).toContain('extends: [\'@stir/base\']')
    expect(readme).toContain('Pin production projects to a reviewed tag or commit.')
  })

  it('keeps Nuxt Image opt-in and outside the required runtime dependency set', () => {
    const packageJson = JSON.parse(readFileSync(
      resolve(rootDir, 'package.json'),
      'utf8',
    )) as {
      dependencies?: Record<string, string>
      peerDependencies?: Record<string, string>
      peerDependenciesMeta?: Record<string, { optional?: boolean }>
    }
    const themeConfig = readFileSync(
      resolve(rootDir, 'layers/theme/nuxt.config.ts'),
      'utf8',
    )

    expect(packageJson.dependencies?.['@nuxt/image']).toBeUndefined()
    expect(packageJson.peerDependencies?.['@nuxt/image']).toBe('^2.0.0')
    expect(packageJson.peerDependenciesMeta?.['@nuxt/image']?.optional).toBe(true)
    expect(themeConfig).toContain('process.env.STIR_IMAGE_DELIVERY === \'nuxt\'')
    expect(themeConfig).toContain('[\'@nuxt/image\']')
    expect(themeConfig).toContain('stirImageDelivery')
  })

  it('ships accessibility auditing as opt-in downstream development tooling', () => {
    const packageJson = JSON.parse(readFileSync(
      resolve(rootDir, 'package.json'),
      'utf8',
    )) as {
      bin?: Record<string, string>
      files?: string[]
      peerDependencies?: Record<string, string>
      peerDependenciesMeta?: Record<string, { optional?: boolean }>
    }

    expect(packageJson.bin?.['stir-a11y']).toBe('./scripts/a11y/run.mjs')
    expect(packageJson.files).toContain('scripts/a11y')
    for (const dependency of ['@axe-core/playwright', '@playwright/test']) {
      expect(packageJson.peerDependencies?.[dependency]).toBeDefined()
      expect(packageJson.peerDependenciesMeta?.[dependency]?.optional).toBe(true)
    }
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

  it('publishes distinct minimal and full preset fixtures', () => {
    const minimalPreset = readFileSync(
      resolve(rootDir, 'presets/minimal/nuxt.config.ts'),
      'utf8',
    )
    const fullPreset = readFileSync(
      resolve(rootDir, 'presets/full/nuxt.config.ts'),
      'utf8',
    )

    expect(minimalPreset).toContain('../../layers/platform')
    expect(fullPreset).toContain('new URL(\'../..\', import.meta.url)')
    expect(existsSync(resolve(
      rootDir,
      'tests/fixtures/minimal-consumer/nuxt.config.ts',
    ))).toBe(true)
    expect(existsSync(resolve(
      rootDir,
      'tests/fixtures/full-consumer/nuxt.config.ts',
    ))).toBe(true)
  })

  it('shares Turnstile without coupling auth to Webforms', () => {
    const authConfig = readFileSync(
      resolve(rootDir, 'layers/auth/nuxt.config.ts'),
      'utf8',
    )
    const webformConfig = readFileSync(
      resolve(rootDir, 'layers/webform/nuxt.config.ts'),
      'utf8',
    )
    const turnstileConfig = readFileSync(
      resolve(rootDir, 'layers/turnstile/nuxt.config.ts'),
      'utf8',
    )

    expect(authConfig).toContain('extends: [\'../turnstile\']')
    expect(webformConfig).toContain('extends: [\'../turnstile\']')
    expect(turnstileConfig).toContain('\'@nuxtjs/turnstile\'')
    expect(existsSync(resolve(
      rootDir,
      'layers/turnstile/app/components/Field/Turnstile.vue',
    ))).toBe(true)
    expect(existsSync(resolve(
      rootDir,
      'layers/webform/app/components/Field/Turnstile.vue',
    ))).toBe(false)
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
    const nuxtConfig = readFileSync(
      resolve(rootDir, 'layers/platform/nuxt.config.ts'),
      'utf8',
    )

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
      resolve(rootDir, 'layers/scripts/app/plugins/userway.client.ts'),
      'utf8',
    )

    expect(userwayPlugin).toContain('useScriptTriggerIdleTimeout')
    expect(userwayPlugin).toContain('warmupStrategy: false')
    expect(userwayPlugin).not.toContain('requestIdleCallback')
  })

  it('keeps optional integration defaults in their capability layers', () => {
    const themeConfig = readFileSync(
      resolve(rootDir, 'layers/theme/app/app.config.ts'),
      'utf8',
    )
    const analyticsConfig = readFileSync(
      resolve(rootDir, 'layers/analytics/app/app.config.ts'),
      'utf8',
    )
    const scriptsConfig = readFileSync(
      resolve(rootDir, 'layers/scripts/app/app.config.ts'),
      'utf8',
    )
    const integrationsConfig = readFileSync(
      resolve(rootDir, 'layers/integrations/app/app.config.ts'),
      'utf8',
    )

    expect(themeConfig).not.toContain('analytics:')
    expect(themeConfig).not.toContain('userway:')
    expect(themeConfig).not.toContain('privacyNotice:')
    expect(themeConfig).not.toContain('popup:')
    expect(analyticsConfig).toContain('plausible:')
    expect(scriptsConfig).toContain('userway:')
    expect(integrationsConfig).toContain('privacyNotice:')
    expect(integrationsConfig).toContain('popup:')
  })
})
