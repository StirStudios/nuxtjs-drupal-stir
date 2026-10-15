import { useAppConfig } from '#imports'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import ClearLayout from '../../../layers/theme/app/layouts/clear.vue'

const shared = vi.hoisted(() => ({
  page: undefined as unknown,
  route: {} as Record<string, unknown>,
}))

mockNuxtImport('useStirDrupalCe', () => () => ({ getPage: () => shared.page }))
mockNuxtImport('useRoute', () => () => shared.route)

const drupalPage = (hero: unknown[] = [], props: Record<string, unknown> = {}) => ({
  title: 'Links',
  content: { element: 'node-page', props: { title: 'Links', ...props }, slots: { hero } },
})
const heroParagraph = { element: 'paragraph-hero', props: { header: 'Authored heading' }, slots: {} }
const routeHeroConfig = () => useAppConfig().stirTheme.routeHero as Record<string, unknown>
const clearLayoutConfig = () => useAppConfig().stirTheme.clearLayout as Record<string, unknown>

async function render(page: unknown) {
  shared.page = ref(page)
  return mountSuspended(ClearLayout, { slots: { default: () => 'Body' } })
}

beforeEach(() => {
  shared.route = { path: '/links', fullPath: '/links', params: { slug: ['links'] }, query: {}, hash: '', meta: {} }
})

afterEach(() => {
  routeHeroConfig().enabled = false
  clearLayoutConfig().title = 'sr-only'
})

describe('clear layout', () => {
  it('renders the page title as a visually hidden h1 when there is no hero', async () => {
    const wrapper = await render(drupalPage())
    const headings = wrapper.findAll('h1')

    expect(headings).toHaveLength(1)
    expect(headings[0]!.text()).toBe('Links')
    expect(headings[0]!.classes()).toContain('sr-only')
  })

  it('shows the title when the theme option says so, unless the page hides it', async () => {
    clearLayoutConfig().title = 'text-3xl'

    expect((await render(drupalPage())).get('h1').classes()).toEqual(['text-3xl'])
    expect((await render(drupalPage([], { hideTitle: true }))).get('h1').classes()).toEqual(['sr-only'])
  })

  it('adds no title h1 when the page has a Hero paragraph', async () => {
    expect((await render(drupalPage([heroParagraph]))).findAll('h1')).toHaveLength(0)
  })

  it('renders the Hero paragraph as the only h1 when the route hero is on', async () => {
    routeHeroConfig().enabled = true
    const headings = (await render(drupalPage([heroParagraph]))).findAll('h1')

    expect(headings).toHaveLength(1)
    expect(headings[0]!.text()).toBe('Authored heading')
  })
})
