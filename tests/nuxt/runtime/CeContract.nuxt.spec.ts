import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent } from 'vue'

// The Drupal page contract the layer renders. Fixtures mirror live payload
// shapes.
const fixture = (name: string) => JSON.parse(
  readFileSync(resolve(__dirname, '../../fixtures/ce', `${name}.json`), 'utf8'),
)

type CeNode = { element?: string, slots?: Record<string, unknown> }

function elementNames(node: unknown, names = new Set<string>()): Set<string> {
  if (Array.isArray(node)) node.forEach(child => elementNames(child, names))
  else if (node && typeof node === 'object') {
    const { element, slots } = node as CeNode

    if (element) names.add(element)
    Object.values(slots ?? {}).forEach(child => elementNames(child, names))
  }

  return names
}

describe('Drupal CE page contract', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it.each(['page-landing', 'page-listing', 'page-not-found', 'page-redirect'])(
    '%s has the page envelope the layer reads',
    (name) => {
      const page = fixture(name)

      expect(Object.keys(page)).toEqual(expect.arrayContaining([
        'title',
        'breadcrumbs',
        'metatags',
        'content_format',
        'content',
        'page_layout',
        'current_user',
        'local_tasks',
        'messages',
      ]))
      expect(page.content_format).toBe('json')
    },
  )

  it('resolves every element to the same component', () => {
    const { resolveCustomElement } = useStirDrupalCe()
    const names = [...new Set([
      ...elementNames(fixture('page-landing').content),
      ...elementNames(fixture('page-listing').content),
      ...elementNames(fixture('page-not-found').content),
    ])].sort()
    const registered = Object.entries(useNuxtApp().vueApp._context.components)
    const resolved = Object.fromEntries(names.map((name) => {
      const component = resolveCustomElement(name)

      return [name, registered.find(([, value]) => value === component)?.[0] ?? null]
    }))

    expect(resolved).toMatchInlineSnapshot(`
      {
        "drupal-markup": "DrupalMarkup",
        "drupal-view-articles": "DrupalViewDefault",
        "entity-reference": "EntityReference",
        "media-image": "MediaImage",
        "media-video": "MediaVideo",
        "node-article": "NodeDefault",
        "node-page": "NodePage",
        "paragraph-accordion": "ParagraphAccordion",
        "paragraph-accordion-item": "ParagraphDefault",
        "paragraph-button": "ParagraphButton",
        "paragraph-hero": "ParagraphHero",
        "paragraph-layout": "ParagraphLayout",
        "paragraph-media": "ParagraphMedia",
        "paragraph-tab": "ParagraphTab",
        "paragraph-tabs": "ParagraphTabs",
        "paragraph-text": "ParagraphText",
        "paragraph-unknown-bundle": "ParagraphDefault",
        "paragraph-view": "ParagraphView",
        "paragraph-webform": "ParagraphWebform",
      }
    `)
  })

  it('renders a landing page through the custom-element tree', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const page = fixture('page-landing')
    const Page = defineComponent({
      setup() {
        const { renderCustomElements } = useStirDrupalCe()

        return () => renderCustomElements(page.content)
      },
    })
    const wrapper = await mountSuspended(Page)

    expect(wrapper.text()).toContain('Welcome')
    expect(wrapper.text()).toContain('Plain rich text with a link.')
    expect(wrapper.text()).toContain('Contact us')
    expect(wrapper.text()).toContain('A question')
    expect(warn.mock.calls.flat().join(' ')).not.toMatch(/Failed to resolve component/)
    wrapper.unmount()
  })
})
