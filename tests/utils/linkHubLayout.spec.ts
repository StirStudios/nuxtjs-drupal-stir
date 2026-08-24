import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

function source(path: string): string {
  return readFileSync(resolve(root, path), 'utf8')
}

describe('link hub layout contract', () => {
  it('uses the Drupal-selected layout without reserving a route', () => {
    const pageRoute = source('layers/theme/app/components/Drupal/PageRoute.vue')

    expect(pageRoute).toContain('layout.value === \'links\'')
    expect(pageRoute).toContain('theme.showBreadcrumbs && !isLinkHubLayout')
    expect(pageRoute).toContain('v-if="!isLinkHubLayout" area="after_main"')
  })

  it('renders a scroll-safe, branded, accessible page shell', () => {
    const layout = source('layers/theme/app/layouts/links.vue')
    const nodeDisplay = source('layers/theme/app/components/Drupal/NodeDisplay.vue')
    const appConfig = source('layers/theme/app/app.config.ts')

    expect(layout).toContain('id="main-content"')
    expect(layout).toContain('aria-label="Social media"')
    expect(layout).toContain('linkHub.logo || navigation.logoClass')
    expect(layout).toContain('<AppLogo :add-classes="logoClasses" />')
    expect(layout).toContain('v-if="heroImage"')
    expect(layout).toContain('v-bind="heroImage"')
    expect(layout).toContain('aria-hidden="true"')
    expect(layout).toContain('heroImage && linkHub.backgroundOverlay')
    expect(layout).not.toContain(':class="linkHub.backgroundOverlay"')
    expect(layout).toContain('{ \'sr-only\': hideTitle }')
    expect(layout).toContain('<slot />')
    expect(layout).not.toContain('<UContainer')
    expect(nodeDisplay).toContain('![\'clear\', \'links\'].includes(pageLayout.value)')
    expect(appConfig).toContain('root: \'relative flex min-h-dvh flex-col')
    expect(appConfig).toContain('container: \'flex w-full flex-col items-center\'')
    expect(appConfig).toContain('logo: \'\'')
    expect(appConfig).toContain('backgroundOverlay: \'after:pointer-events-none after:absolute')
    expect(appConfig).toContain('heading: \'mx-4 mb-6 text-center text-xl leading-7\'')
    expect(appConfig).not.toContain('linkHub: {\n      root: \'flex h-screen')
  })
})
