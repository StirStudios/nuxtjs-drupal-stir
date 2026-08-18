import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

function source(path: string): string {
  return readFileSync(resolve(root, path), 'utf8')
}

describe('node override contract', () => {
  it('keeps NodeDisplay responsible for hero and all direct field slots', () => {
    const nodeDisplay = source('layers/theme/app/components/Drupal/NodeDisplay.vue')

    expect(nodeDisplay).toContain('name="hero"')
    expect(nodeDisplay).toContain('contentSlotNames')
    expect(nodeDisplay).toContain(':name="slotName"')
    expect(nodeDisplay).toContain(':url="props.url || props.path?.alias"')
    expect(nodeDisplay).toContain('\'default\', \'uid\'')
    expect(nodeDisplay).toContain('v-if="renderMode !== \'teaser\'"')
    expect(nodeDisplay).toContain(':link="props.editLink"')
    expect(nodeDisplay).toContain('resolveBooleanProp(props.isArticle)')
    expect(nodeDisplay).toContain('<ShareLinks')
    expect(nodeDisplay).toContain(':title="props.title"')
    expect(nodeDisplay).toContain('theme.article.container')

    const appConfig = source('layers/theme/app/app.config.ts')

    expect(appConfig).toContain('container: \'max-w-3xl\'')

    const nodeTypes = source('layers/theme/app/types/Node.ts')

    expect(nodeTypes).toContain('url?: string')
    expect(nodeTypes).toContain('summary?: string')
  })

  it('uses the accessible default layout when Drupal omits page_layout', () => {
    const pageRoute = source('layers/theme/app/components/Drupal/PageRoute.vue')

    expect(pageRoute).toContain('pageLayout.value || \'default\'')
  })

  it('redirects the configured Drupal front-page alias to the public root', () => {
    const pageRoute = source('layers/theme/app/components/Drupal/PageRoute.vue')

    expect(pageRoute).toContain('page.value?.is_front_page === true && route.path !== \'/\'')
    expect(pageRoute).toContain('const nuxtApp = useNuxtApp() as { $localePath?: (path: string) => string }')
    expect(pageRoute).toContain('path: nuxtApp.$localePath?.(\'/\') || \'/\'')
    expect(pageRoute).toContain('query: route.query')
    expect(pageRoute).toContain('{ redirectCode: 301, replace: true }')
  })

  it('keeps page metadata safe while a client-side alias redirect retires its page', () => {
    const pageRoute = source('layers/theme/app/components/Drupal/PageRoute.vue')

    expect(pageRoute).toContain('const currentPage = page.value || {')
    expect(pageRoute).toContain('prepareGlobalSeoAssets(')
    expect(pageRoute).toContain('metatags as GlobalSeoResponse')
    expect(pageRoute).toContain('usePageHead(pageHead, [\'meta\', \'link\'])')
  })

  it('promotes page fetch failures to the global error page during client rendering', () => {
    const pageRoute = source('layers/theme/app/components/Drupal/PageRoute.vue')

    expect(pageRoute).toContain('fatal: true')
  })

  it('keeps the default node component forwarding every Drupal slot', () => {
    const nodeDefault = source('layers/theme/app/components/global/node--default.vue')

    expect(nodeDefault).toContain('forwardedSlotNames')
    expect(nodeDefault).toContain('#[slotName]="slotProps"')
  })
})
