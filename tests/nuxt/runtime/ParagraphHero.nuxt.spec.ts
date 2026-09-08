import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi } from 'vitest'
import { h, nextTick, ref } from 'vue'
import Hero from '../../../layers/theme/app/components/global/Paragraph/Hero.vue'
import { drupalPageKey } from '../../../layers/theme/app/utils/drupalPage'
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
})
