import { useAppConfig } from '#imports'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import RouteHero from '../../../layers/theme/app/components/RouteHero.vue'
import RouteHeroSection from '../../../layers/theme/app/components/RouteHero/Section.vue'
import NodePage from '../../../layers/theme/app/components/global/node--page.vue'
import {
  registerRouteHeroResolver,
  useRouteHero,
} from '../../../layers/theme/app/composables/useRouteHero'
import {
  normalizeRouteHero,
  resolveEditorialRouteHero,
  resolvePageRouteHero,
} from '../../../layers/theme/app/utils/routeHero'
import type { RouteHero as RouteHeroModel } from '../../../layers/theme/app/types/RouteHero'

const shared = vi.hoisted(() => ({
  page: undefined as unknown,
  route: {} as Record<string, unknown>,
}))

mockNuxtImport('useStirDrupalCe', () => () => ({ getPage: () => shared.page }))
mockNuxtImport('useRoute', () => () => shared.route)

const heroParagraph = (props: Record<string, unknown> = {}, slots: Record<string, unknown> = {}) => ({
  element: 'paragraph-hero',
  props: { header: 'Authored heading', eyebrow: 'Eyebrow', text: '<p>Hero <strong>intro</strong></p>', ...props },
  slots: {
    button: [
      { element: 'paragraph-button', props: { link: { title: 'Learn more', url: '/about' }, variant: 'outline' } },
      { element: 'paragraph-button', props: { link: { title: '  ', url: '/blank' } } },
    ],
    media: [{ element: 'media-image', props: { src: '/files/hero.jpg', alt: 'Dancers', width: '1920', height: 1080 } }],
    ...slots,
  },
})

const drupalPage = (element = 'node-page', hero: unknown[] = []) => ({
  title: 'Drupal title',
  content: { element, props: { title: 'Drupal title' }, slots: { hero } },
  metatags: { meta: [{ name: 'title', content: 'Meta title | Site' }, { name: 'description', content: 'Meta description' }] },
  site_info: { name: 'Site' },
})

const routeHeroConfig = () => useAppConfig().stirTheme.routeHero as Record<string, unknown>

async function resolveHero() {
  let resolved: ReturnType<typeof useRouteHero> | undefined
  const Harness = defineComponent({
    setup() {
      resolved = useRouteHero()
      return () => h('div')
    },
  })
  const wrapper = await mountSuspended(Harness)
  const hero = resolved!.hero.value

  wrapper.unmount()
  return hero
}

beforeEach(() => {
  shared.page = ref(null)
  shared.route = { path: '/about', fullPath: '/about', params: { slug: ['about'] }, query: {}, hash: '', meta: {} }
})

describe('route hero resolution', () => {
  it('builds the hero from the page Hero paragraph without blank actions', () => {
    const hero = resolvePageRouteHero(drupalPage('node-page', [heroParagraph()]))

    expect(hero).toEqual({
      title: 'Authored heading',
      eyebrow: 'Eyebrow',
      description: 'Hero intro',
      actions: [{ label: 'Learn more', to: '/about', variant: 'outline', external: false }],
      hideTitle: false,
      image: { src: '/files/hero.jpg', alt: 'Dancers', width: 1920, height: 1080 },
      variant: 'cover',
    })
  })

  it('falls back to the page title, never the metatag description, for blank authored values', () => {
    const blank = heroParagraph({ header: '  ', eyebrow: ' ', text: '<p> </p>' }, { button: [], media: [{ props: { src: ' ' } }] })

    expect(resolvePageRouteHero(drupalPage('node-page', [blank]))).toEqual({
      title: 'Drupal title',
      hideTitle: false,
      variant: 'simple',
    })
    const untitled = drupalPage()

    untitled.title = ''
    untitled.content.props.title = ''
    expect(resolvePageRouteHero(untitled)?.title).toBe('Meta title')
  })

  it('only resolves configured page elements', () => {
    expect(resolvePageRouteHero(drupalPage('node-article'))).toBeNull()
    expect(resolvePageRouteHero(drupalPage('node-landing'), ['node-landing'])?.title).toBe('Drupal title')
    expect(normalizeRouteHero({ title: '   ' })).toBeNull()
  })

  it('ignores the retained Drupal page on Nuxt-only routes', async () => {
    shared.page = ref(drupalPage('node-page', [heroParagraph()]))
    expect((await resolveHero())?.title).toBe('Authored heading')
    shared.route = { ...shared.route, path: '/account', params: {} }
    expect(await resolveHero()).toBeNull()
  })

  it('merges a matching route definition over the page hero', async () => {
    const config = routeHeroConfig()
    const routes = config.routes

    config.routes = [{ path: '/about*', title: 'About us', variant: 'simple' }]
    shared.page = ref(drupalPage('node-page', [heroParagraph()]))
    try {
      expect(await resolveHero()).toMatchObject({
        title: 'About us',
        variant: 'simple',
        description: 'Hero intro',
      })
      shared.route = { ...shared.route, path: '/pricing', params: {} }
      config.routes = [{ path: '/pricing', title: 'Pricing', eyebrow: 'Plans' }]
      expect(await resolveHero()).toMatchObject({ title: 'Pricing', eyebrow: 'Plans' })
    }
    finally {
      config.routes = routes
    }
  })

  it('lets route meta and registered resolvers take precedence', async () => {
    shared.page = ref(drupalPage('node-page', [heroParagraph()]))
    const dispose = registerRouteHeroResolver(({ pageHero }) => () =>
      pageHero.value ? { ...pageHero.value, eyebrow: 'Resolved' } : null)

    try {
      expect(await resolveHero()).toMatchObject({ title: 'Authored heading', eyebrow: 'Resolved' })
      shared.route = { ...shared.route, meta: { routeHero: { title: 'Meta hero' } } }
      expect(await resolveHero()).toMatchObject({ title: 'Meta hero', eyebrow: 'Eyebrow' })
      shared.route = { ...shared.route, meta: { routeHero: false } }
      expect(await resolveHero()).toBeNull()
    }
    finally {
      dispose()
    }
    shared.route = { ...shared.route, meta: {} }
    expect((await resolveHero())?.eyebrow).toBe('Eyebrow')
  })

  it('builds an overlap editorial hero and drops the thumbnail for media-first content', () => {
    const image = { src: '/files/thumb.jpg', alt: '' }

    expect(resolveEditorialRouteHero({ title: 'Article', summary: 'Summary', image })).toMatchObject({
      title: 'Article',
      description: 'Summary',
      image: { src: '/files/thumb.jpg' },
      variant: 'overlap',
    })
    expect(resolveEditorialRouteHero({ title: 'Video', image, mediaFirst: true })?.image).toBeUndefined()
  })
})

describe('route hero rendering', () => {
  const mountSection = (hero: RouteHeroModel, slots = {}) =>
    mountSuspended(RouteHeroSection, { props: { hero }, slots })

  it.each(['cover', 'simple', 'overlap'] as const)('renders one H1 in the %s variant', async (variant) => {
    const wrapper = await mountSection({
      title: 'Title',
      eyebrow: 'Eyebrow',
      description: 'Description',
      image: { src: '/files/hero.jpg', alt: '' },
      variant,
    })
    const variants = useAppConfig().stirTheme.routeHero.variants

    expect(wrapper.findAll('h1')).toHaveLength(1)
    expect(wrapper.get('h1').text()).toBe('Title')
    expect(wrapper.get('.eyebrow, p').text()).toBe('Eyebrow')
    expect(wrapper.get('section').attributes('data-variant')).toBe(variant)
    expect(wrapper.get('section').classes().join(' ')).toContain(variants[variant]?.base ?? 'route-hero')
    expect(wrapper.find('img').exists()).toBe(variant !== 'simple')
    wrapper.unmount()
  })

  it('loads the hero image eagerly at high priority', async () => {
    const wrapper = await mountSection({ title: 'Title', image: { src: '/files/hero.jpg', alt: 'Dancers', position: 'top' } })
    const img = wrapper.get('img')

    expect(img.attributes('loading')).toBe('eager')
    expect(img.attributes('fetchpriority')).toBe('high')
    expect(img.attributes('alt')).toBe('Dancers')
    expect(img.attributes('style')).toContain('object-position: top')
    wrapper.unmount()
  })

  it('omits blank optional content and keeps action names', async () => {
    const wrapper = await mountSection(normalizeRouteHero({
      title: 'Title',
      eyebrow: ' ',
      description: '',
      actions: [{ label: 'Start', to: '/start' }, { label: '', to: '/unnamed' }],
    })!)

    expect(wrapper.findAll('p')).toHaveLength(0)
    expect(wrapper.findAll('a').map(link => [link.text(), link.attributes('href')])).toEqual([['Start', '/start']])
    wrapper.unmount()
  })

  it('keeps a hidden title as the single H1 and renders title lines', async () => {
    const wrapper = await mountSection({ title: 'Your connection to dance', titleLines: ['Your', 'Connection'], hideTitle: true })

    expect(wrapper.findAll('h1')).toHaveLength(1)
    expect(wrapper.get('h1').classes()).toContain('sr-only')
    expect(wrapper.get('h1').findAll('span').map(line => line.text())).toEqual(['Your', 'Connection'])
    wrapper.unmount()
  })

  it('places playable media before the heading only for media-first heroes', async () => {
    const slots = { media: () => h('video', { 'data-player': 'true' }), default: () => h('div', { class: 'body' }, 'Body') }
    const mediaFirst = await mountSection({ title: 'Video', variant: 'overlap', mediaFirst: true, image: { src: '/files/thumb.jpg' } }, slots)
    const content = mediaFirst.get('h1').element.parentElement!

    expect(content.firstElementChild?.tagName).toBe('VIDEO')
    expect(mediaFirst.find('img').exists()).toBe(false)
    mediaFirst.unmount()

    const article = await mountSection({ title: 'Article', variant: 'overlap' }, slots)
    const order = [...article.get('h1').element.parentElement!.children].map(child => child.tagName)

    expect(order).toEqual(['H1', 'VIDEO', 'DIV'])
    article.unmount()
  })

  it('renders nothing from the layout wrapper when no hero resolves', async () => {
    const wrapper = await mountSuspended(RouteHero)

    expect(wrapper.find('section').exists()).toBe(false)
    wrapper.unmount()
  })
})

describe('node--page hero slot ownership', () => {
  afterEach(() => {
    routeHeroConfig().enabled = false
  })

  it.each([false, true])('renders the inline hero slot only when the route hero is disabled (enabled=%s)', async (routeHeroEnabled) => {
    routeHeroConfig().enabled = routeHeroEnabled
    const wrapper = await mountSuspended(NodePage, {
      props: { title: 'Page' },
      slots: {
        hero: () => h('h1', 'Inline hero'),
        section: () => h('section', 'Page content'),
      },
    })

    expect(wrapper.text()).toContain('Page content')
    expect(wrapper.find('h1').exists()).toBe(!routeHeroEnabled)
    wrapper.unmount()
  })
})
