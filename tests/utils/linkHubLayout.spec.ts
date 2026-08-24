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
    const appConfig = source('layers/theme/app/app.config.ts')

    expect(layout).toContain('id="main-content"')
    expect(layout).toContain('aria-label="Social media"')
    expect(layout).toContain('<AppLogo :add-classes="linkHub.logo" />')
    expect(layout).toContain('<slot />')
    expect(appConfig).toContain('root: \'flex min-h-dvh flex-col')
    expect(appConfig).toContain('[&_h1:not(.sr-only)]:text-xl')
    expect(appConfig).toContain('[&_h1:not(.sr-only)]:leading-7')
    expect(appConfig).not.toContain('linkHub: {\n      root: \'flex h-screen')
  })
})
