import { useAppConfig } from '#imports'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, inject, nextTick, ref } from 'vue'
import Hero from '../../../layers/theme/app/components/global/Paragraph/Hero.vue'
import { drupalPageKey } from '../../../layers/theme/app/utils/drupalPage'
import { sectionHeroMediaKey } from '../../../layers/theme/app/utils/imageDelivery'
import { useNavLock } from '../../../layers/theme/app/composables/useNavLock'

const shared = vi.hoisted(() => ({ getPage: vi.fn() }))

mockNuxtImport('useStirDrupalCe', () => () => ({ getPage: shared.getPage }))

type Page = NonNullable<typeof drupalPageKey extends import('vue').InjectionKey<infer P> ? P : never>['value']
const makePage = (title: string): Page => ({
  title,
  content: { props: { title } },
  is_front_page: false,
  page_layout: 'default',
  breadcrumbs: [],
  settings: {},
  messages: [],
  content_format: 'json',
  local_tasks: { primary: [], secondary: [] },
  metatags: { meta: [], link: [], jsonld: [] },
})

describe('Drupal Hero page ownership and headings', () => {
  it('keeps separate page instances independent while navigation is locked', async () => {
    const globalPage = ref(makePage('Shared page'))

    shared.getPage.mockReturnValue(globalPage)
    const origin = ref(makePage('Origin'))
    const destination = ref(makePage('Destination'))
    const first = await mountSuspended(Hero, { global: { provide: { [drupalPageKey as symbol]: origin } } })
    const { locked } = useNavLock()

    locked.value = true
    const second = await mountSuspended(Hero, { global: { provide: { [drupalPageKey as symbol]: destination } } })

    try {
      expect(first.get('h1').text()).toBe('Origin')
      expect(second.get('h1').text()).toBe('Destination')
      destination.value = makePage('Updated destination')
      await nextTick()
      expect(second.get('h1').text()).toBe('Updated destination')
      expect(first.get('h1').text()).toBe('Origin')
      globalPage.value = makePage('Different shared page')
      await nextTick()
      expect(first.get('h1').text()).toBe('Origin')
      expect(second.get('h1').text()).toBe('Updated destination')
    }
    finally {
      locked.value = false
      first.unmount()
      second.unmount()
    }
  })

  it.each((['start', 'center', 'end'] as const).flatMap(horizontal =>
    (['start', 'center', 'end'] as const).map(vertical => ({ horizontal, vertical })),
  ))('aligns the main hero $horizontal/$vertical without dropping theme classes', async ({ horizontal, vertical }) => {
    const page = ref(makePage('Page title'))

    page.value.is_front_page = true
    const wrapper = await mountSuspended(Hero, {
      props: { align: { justify: horizontal, items: vertical }, header: 'Heading', text: '<p>Intro</p>' },
      slots: { button: () => h('button', 'Action') },
      global: { provide: { [drupalPageKey as symbol]: page } },
    })
    const content = wrapper.get('.hero-content-aligned')

    expect(wrapper.get('section').classes()).toContain(`items-${vertical}`)
    expect(content.classes()).toContain(`items-${horizontal}`)
    expect(content.classes()).toContain(`text-${horizontal}`)
    expect(content.classes()).toContain('relative')
    expect(content.classes()).not.toContain('absolute')
    expect(content.classes()).toContain('lg:p-24')
    expect(wrapper.get('.hero-actions').classes()).toContain(`justify-${horizontal}`)
    wrapper.unmount()
  })

  it.each([true, false])('uses one authored main H1 with an independent eyebrow (front=%s)', async (front) => {
    const page = ref(makePage('Drupal page title'))

    page.value.is_front_page = front
    const wrapper = await mountSuspended(Hero, {
      props: { header: 'Authored heading', eyebrow: 'Eyebrow', headerTag: 'h2' },
      global: { provide: { [drupalPageKey as symbol]: page } },
    })

    expect(wrapper.findAll('h1')).toHaveLength(1)
    expect(wrapper.get('h1').text()).toBe('Authored heading')
    expect(wrapper.find('h2').exists()).toBe(false)
    expect(wrapper.get('.eyebrow').element.tagName).toBe('P')
    page.value.content = { props: { title: 'Drupal page title', hideTitle: true } }
    await nextTick()
    expect(wrapper.get('h1').classes()).toContain('sr-only')
    expect(wrapper.get('h1').text()).toBe('Authored heading')
    await wrapper.setProps({ header: '  ' })
    expect(wrapper.get('h1').text()).toBe('Drupal page title')
    expect(wrapper.findAll('h1')).toHaveLength(1)
    wrapper.unmount()
  })

  it('uses the Drupal page title when the content title is blank and preserves a hidden H1', async () => {
    const page = ref(makePage('Page title'))

    page.value.content = { props: { title: '   ', hideTitle: true } }
    const wrapper = await mountSuspended(Hero, { global: { provide: { [drupalPageKey as symbol]: page } } })

    expect(wrapper.findAll('h1')).toHaveLength(1)
    expect(wrapper.get('h1').text()).toBe('Page title')
    expect(wrapper.get('h1').classes()).toContain('sr-only')
    wrapper.unmount()
  })

  it('does not render an empty heading or text wrapper', async () => {
    const wrapper = await mountSuspended(Hero, { global: { provide: { [drupalPageKey as symbol]: ref(makePage('   ')) } } })

    expect(wrapper.find('h1').exists()).toBe(false)
    expect(wrapper.get('section').element.children).toHaveLength(0)
    wrapper.unmount()
  })

  it('lets the title slot replace the default H1', async () => {
    const wrapper = await mountSuspended(Hero, {
      global: { provide: { [drupalPageKey as symbol]: ref(makePage('Default title')) } },
      slots: { title: () => h('h1', 'Custom title') },
    })

    expect(wrapper.findAll('h1')).toHaveLength(1)
    expect(wrapper.get('h1').text()).toBe('Custom title')
    wrapper.unmount()
  })

  it('preserves both action links and omits the group when no actions are supplied', async () => {
    const options = { global: { provide: { [drupalPageKey as symbol]: ref(makePage('Hero')) } } }
    const empty = await mountSuspended(Hero, options)

    expect(empty.find('.hero-actions').exists()).toBe(false)
    empty.unmount()
    const wrapper = await mountSuspended(Hero, {
      ...options,
      slots: { button: () => [
        h('div', { class: 'flex w-full' }, [h('a', { href: '/work' }, 'Explore the work')]),
        h('div', { class: 'flex w-full' }, [h('a', { href: '/contact' }, 'Discuss an opportunity')]),
      ] },
    })

    expect(wrapper.get('.hero-actions').findAll('a').map(link => [link.text(), link.attributes('href')])).toEqual([
      ['Explore the work', '/work'],
      ['Discuss an opportunity', '/contact'],
    ])
    wrapper.unmount()
  })

  it('keeps simple mode as supplied slot content without adding a heading', async () => {
    const wrapper = await mountSuspended(Hero, {
      props: { mode: 'simple' },
      global: { provide: { [drupalPageKey as symbol]: ref(makePage('Default title')) } },
      slots: { header: () => h('h1', 'Authored title') },
    })

    expect(wrapper.findAll('h1')).toHaveLength(1)
    expect(wrapper.find('section').exists()).toBe(false)
    wrapper.unmount()
  })
  it.each(['field_section', 'field_content'])('uses authored section headings in %s without the page title', async (placement) => {
    const wrapper = await mountSuspended(Hero, {
      props: { placement, header: 'Section title', headerTag: 'h3', label: 'Contact', mediaHeight: 'feature', align: { justify: 'end', items: 'end', text: 'end' } },
      global: { provide: { [drupalPageKey as symbol]: ref(makePage('Page title')) } },
    })

    expect(wrapper.find('h1').exists()).toBe(false)
    expect(wrapper.get('h3').text()).toBe('Section title')
    expect(wrapper.get('section').attributes('id')).toBe('contact')
    expect(wrapper.get('.hero-content-aligned').classes()).toContain('items-end')
    expect(wrapper.get('section').attributes('style')).toContain('min-height')
    await wrapper.setProps({ headerTag: 'h1' })
    expect(wrapper.get('h2').text()).toBe('Section title')
    wrapper.unmount()
  })

  it.each([
    { header: 'Only title', text: '', button: false },
    { header: '', text: '<p>Only intro</p>', button: false },
    { header: '', text: '', button: true },
    { header: 'Title and button', text: '', button: true },
    { header: '  ', text: '', button: false },
  ])('renders only supplied section content: %j', async ({ header, text, button }) => {
    const wrapper = await mountSuspended(Hero, {
      props: { placement: 'field_section', header, text },
      global: { provide: { [drupalPageKey as symbol]: ref(makePage('Page title')) } },
      slots: button ? { button: () => h('a', { href: '/contact' }, 'Contact') } : {},
    })

    expect(wrapper.find('h1').exists()).toBe(false)
    expect(wrapper.find('h2').exists()).toBe(Boolean(header.trim()))
    expect(wrapper.find('.lead').exists()).toBe(Boolean(text))
    expect(wrapper.find('.hero-actions').exists()).toBe(button)
    expect(wrapper.text()).not.toContain('Page title')
    wrapper.unmount()
  })

  it('renders an eyebrow as text rather than another heading', async () => {
    const wrapper = await mountSuspended(Hero, {
      props: { placement: 'field_section', header: 'Section', eyebrow: 'Featured opportunity' },
      global: { provide: { [drupalPageKey as symbol]: ref(makePage('Page')) } },
    })

    expect(wrapper.get('.eyebrow').element.tagName).toBe('P')
    expect(wrapper.get('.eyebrow').text()).toBe('Featured opportunity')
    expect(wrapper.findAll('h2')).toHaveLength(1)
    await wrapper.setProps({ eyebrow: ' ' })
    expect(wrapper.find('.eyebrow').exists()).toBe(false)
    wrapper.unmount()
  })

  describe('theme presentation options', () => {
    const Media = defineComponent({
      props: { isHero: Boolean, name: { type: String, default: '' } },
      setup: mediaProps => () => h('figure', { 'data-hero': String(mediaProps.isHero), 'data-name': mediaProps.name }),
    })
    const media = () => [h(Media, { name: 'teaser' }), h(Media, { name: 'hero' })]
    const makeWorkPage = () => {
      const page = ref(makePage('GROOV3'))

      page.value.content = { props: { title: 'GROOV3', type: 'node-work' } }
      return page
    }

    async function withHeroTheme(overrides: Record<string, unknown>, run: () => Promise<void>) {
      const hero = useAppConfig().stirTheme.hero as Record<string, unknown>
      const original = Object.fromEntries(Object.keys(overrides).map(key => [key, hero[key]]))

      Object.assign(hero, overrides)
      try {
        await run()
      }
      finally {
        Object.assign(hero, original)
      }
    }

    it('renders a configured node type inline with the selected media item', async () => {
      await withHeroTheme({ nodeTypes: { 'node-work': { layout: 'inline', media: 'last' } } }, async () => {
        const wrapper = await mountSuspended(Hero, {
          slots: { media },
          global: { provide: { [drupalPageKey as symbol]: makeWorkPage() } },
        })
        const section = wrapper.get('section')

        expect(section.classes()).toContain('max-w-(--ui-container)')
        expect(section.classes()).not.toContain('hero')
        expect(wrapper.findAll('figure')).toHaveLength(1)
        expect(wrapper.get('figure').attributes()).toMatchObject({ 'data-name': 'hero', 'data-hero': 'false' })
        expect(wrapper.get('h1').text()).toBe('GROOV3')
        expect(section.element.lastElementChild?.tagName).toBe('FIGURE')
        wrapper.unmount()

        const sectionHero = await mountSuspended(Hero, {
          props: { placement: 'field_section', header: 'Section' },
          slots: { media },
          global: { provide: { [drupalPageKey as symbol]: makeWorkPage() } },
        })

        expect(sectionHero.get('figure').attributes()).toMatchObject({ 'data-name': 'teaser', 'data-hero': 'true' })
        sectionHero.unmount()
      })
    })

    it('lets section hero media size itself as the background', async () => {
      const SectionMedia = defineComponent({
        setup: () => {
          const sectionHero = inject(sectionHeroMediaKey, undefined)

          return () => h('figure', { 'data-section-hero': String(Boolean(sectionHero?.value)) })
        },
      })
      const wrapper = await mountSuspended(Hero, {
        props: { placement: 'field_section', header: 'Section' },
        slots: { media: () => [h(SectionMedia)] },
        global: { provide: { [drupalPageKey as symbol]: makeWorkPage() } },
      })
      const classes = wrapper.get('section').classes()

      expect(wrapper.get('figure').attributes('data-section-hero')).toBe('true')
      expect(classes).toContain('dark')
      expect(classes.some(name => name.startsWith('[&>'))).toBe(false)
      wrapper.unmount()
    })

    it('keeps the page colour scheme for a section hero without media', async () => {
      const wrapper = await mountSuspended(Hero, {
        props: { placement: 'field_section', header: 'Section' },
        global: { provide: { [drupalPageKey as symbol]: makeWorkPage() } },
      })

      expect(wrapper.get('section').classes()).not.toContain('dark')
      wrapper.unmount()
    })

    it('uses valid overlay utilities', () => {
      const overlay = String(useAppConfig().stirTheme.hero.overlay)

      expect(overlay).not.toMatch(/to-bg-|bg-gradient-to-/)
      expect(overlay).toContain('after:to-black/10')
    })

    it('keeps background media for node types without configuration', async () => {
      const wrapper = await mountSuspended(Hero, {
        slots: { media },
        global: { provide: { [drupalPageKey as symbol]: makeWorkPage() } },
      })

      expect(wrapper.get('section').classes()).toContain('hero')
      expect(wrapper.get('figure').attributes()).toMatchObject({ 'data-name': 'teaser', 'data-hero': 'true' })
      wrapper.unmount()
    })

    it('applies text spacing and the backdrop only to text-only inner-page heroes', async () => {
      await withHeroTheme({ textSpacing: 'pt-99', backdrop: 'bg-red-500' }, async () => {
        const page = ref(makePage('Inner page'))
        const wrapper = await mountSuspended(Hero, {
          props: { text: '<p>Intro</p>' },
          global: { provide: { [drupalPageKey as symbol]: page } },
        })

        expect(wrapper.get('section').classes()).toContain('pt-99')
        expect(wrapper.get('section').classes()).toContain('isolate')
        expect(wrapper.get('.hero-backdrop').attributes('aria-hidden')).toBe('true')
        expect(wrapper.get('.hero-backdrop').classes()).toContain('bg-red-500')
        page.value.is_front_page = true
        await nextTick()
        expect(wrapper.find('.hero-backdrop').exists()).toBe(false)
        wrapper.unmount()
      })
    })

    it('wraps simple mode slots in the supplied classes', async () => {
      const wrapper = await mountSuspended(Hero, {
        props: { mode: 'simple', classes: 'contained' },
        slots: { media },
        global: { provide: { [drupalPageKey as symbol]: ref(makePage('Page')) } },
      })

      expect(wrapper.get('.contained').findAll('figure')).toHaveLength(2)
      wrapper.unmount()
    })

    it('keeps the front-page title as the H1 with the header or slogan beneath it', async () => {
      await withHeroTheme({ front: { subtitle: 'below', subtitleClass: 'hero-subtitle', showText: false } }, async () => {
        const page = ref(makePage('Front page title'))

        page.value.is_front_page = true
        Object.assign(page.value, { site_info: { name: 'Site', slogan: 'Site slogan' } })
        const wrapper = await mountSuspended(Hero, {
          props: { header: 'Authored header', text: '<p>Intro</p>' },
          global: { provide: { [drupalPageKey as symbol]: page } },
        })

        expect(wrapper.findAll('h1')).toHaveLength(1)
        expect(wrapper.get('h1').text()).toBe('Front page title')
        expect(wrapper.get('h2.subtitle').text()).toBe('Authored header')
        expect(wrapper.get('h2.subtitle').classes()).toContain('hero-subtitle')
        expect(wrapper.find('.lead').exists()).toBe(false)
        await wrapper.setProps({ header: '' })
        expect(wrapper.get('h2.subtitle').text()).toBe('Site slogan')
        page.value.is_front_page = false
        await nextTick()
        expect(wrapper.find('h2.subtitle').exists()).toBe(false)
        expect(wrapper.get('h1').text()).toBe('Front page title')
        expect(wrapper.find('.lead').exists()).toBe(true)
        wrapper.unmount()
      })
    })
  })
})
