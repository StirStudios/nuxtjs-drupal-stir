import { describe, expect, it, vi } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h, inject, ref } from 'vue'
import PageRoute from '../../../layers/theme/app/components/Drupal/PageRoute.vue'
import { drupalPageKey } from '../../../layers/theme/app/utils/drupalPage'
import { layoutEditLinksKey, presentationEditTargetsKey } from '../../../layers/theme/app/utils/layoutEditLinks'
import { pageRefreshKey } from '../../../layers/theme/app/utils/pageRefresh'

const state = vi.hoisted(() => ({ fetchPage: vi.fn(), getPage: vi.fn(), refreshNuxtData: vi.fn() }))

mockNuxtImport('useStirDrupalCe', () => () => ({
  fetchPage: state.fetchPage,
  getPage: state.getPage,
  renderCustomElements: () => h('p', 'Page content'),
  usePageHead: vi.fn(),
}))

mockNuxtImport('refreshNuxtData', () => state.refreshNuxtData)

const Probe = defineComponent({
  setup() {
    const page = inject(drupalPageKey)
    const layouts = inject(layoutEditLinksKey)
    const presentations = inject(presentationEditTargetsKey)

    return () => h('p', { id: 'edit-targets', 'data-page-title': page?.value.title }, `${layouts?.value.get('destination')?.editLink}:${presentations?.value.get('/edit/destination')?.paragraphId}`)
  },
})
const Layout = defineComponent({
  props: ['name'],
  setup(props, { slots }) {
    return () => h('div', { 'data-layout': props.name }, slots.default?.())
  },
})

describe('Drupal PageRoute ownership', () => {
  it('renders destination layout and editor targets independently of shared current-page state', async () => {
    state.getPage.mockReturnValue(ref({ page_layout: 'links', content: {} }))
    state.fetchPage.mockResolvedValue(ref({
      page_layout: 'clear',
      title: 'Destination',
      content: {
        element: 'paragraph-layout',
        props: { uuid: 'destination', editLink: '/edit/destination', presentationEdit: { paragraphId: 42 } },
      },
    }))
    const wrapper = await mountSuspended(PageRoute, {
      global: { stubs: { NuxtLayout: Layout } },
      slots: { default: () => h(Probe) },
    })

    expect(wrapper.get('[data-layout]').attributes('data-layout')).toBe('clear')
    expect(wrapper.get('#edit-targets').text()).toBe('/edit/destination:42')
    expect(wrapper.get('#edit-targets').attributes('data-page-title')).toBe('Destination')
    expect(state.getPage).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('refreshes the page through its keyed useFetch data', async () => {
    let refresh: (() => Promise<void>) | undefined
    const RefreshProbe = defineComponent({
      setup() {
        refresh = inject<() => Promise<void>>(pageRefreshKey)
        return () => h('p')
      },
    })

    state.refreshNuxtData.mockReset()
    state.fetchPage.mockResolvedValue(ref({ key: 'page:/about', page_layout: 'clear', content: {} }))
    const wrapper = await mountSuspended(PageRoute, {
      global: { stubs: { NuxtLayout: Layout } },
      slots: { default: () => h(RefreshProbe) },
    })

    await refresh?.()

    expect(state.refreshNuxtData).toHaveBeenCalledWith('page:/about')
    wrapper.unmount()
  })
})
