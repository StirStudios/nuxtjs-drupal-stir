import { describe, expect, it, vi } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h, inject, ref } from 'vue'
import PageRoute from '../../../layers/theme/app/components/Drupal/PageRoute.vue'
import { layoutEditLinksKey, presentationEditTargetsKey } from '../../../layers/theme/app/utils/layoutEditLinks'

const state = vi.hoisted(() => ({ fetchPage: vi.fn(), getPage: vi.fn() }))

mockNuxtImport('useStirDrupalCe', () => () => ({
  fetchPage: state.fetchPage,
  getPage: state.getPage,
  refreshPage: vi.fn(),
  renderCustomElements: () => h('p', 'Page content'),
  usePageHead: vi.fn(),
}))

const Probe = defineComponent({
  setup() {
    const layouts = inject(layoutEditLinksKey)
    const presentations = inject(presentationEditTargetsKey)

    return () => h('p', { id: 'edit-targets' }, `${layouts?.value.get('destination')?.editLink}:${presentations?.value.get('/edit/destination')?.paragraphId}`)
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
    expect(state.getPage).not.toHaveBeenCalled()
    wrapper.unmount()
  })
})
