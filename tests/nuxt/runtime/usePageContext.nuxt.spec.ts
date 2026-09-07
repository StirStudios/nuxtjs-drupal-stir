import { describe, expect, it, vi } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h, ref } from 'vue'
import { usePageContext } from '../../../layers/theme/app/composables/usePageContext'

const shared = vi.hoisted(() => ({ getPage: vi.fn() }))

mockNuxtImport('useStirDrupalCe', () => () => ({ getPage: shared.getPage }))

describe('page-local Drupal context', () => {
  it('uses the supplied page and follows its refresh without reading shared page state', async () => {
    const localPage = ref<NonNullable<Parameters<typeof usePageContext>[0]>['value']>({
      title: 'Destination',
      settings: {},
      breadcrumbs: [],
      content_format: 'json',
      local_tasks: { primary: [], secondary: [] },
      messages: [],
      metatags: { meta: [], link: [], jsonld: [] },
      page_layout: 'clear',
      is_front_page: false,
      current_user: { authenticated: true },
    })
    const Harness = defineComponent({
      setup() {
        const context = usePageContext(localPage)

        return () => h('p', `${context.pageLayout.value}:${context.isAuthenticated.value}`)
      },
    })

    shared.getPage.mockClear()
    const wrapper = await mountSuspended(Harness)

    expect(wrapper.text()).toBe('clear:true')
    expect(shared.getPage).not.toHaveBeenCalled()
    localPage.value = { ...localPage.value, page_layout: 'links', is_front_page: false, current_user: { authenticated: false } }
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toBe('links:false')
    wrapper.unmount()
  })

  it('preserves shared context for callers without an explicit page', async () => {
    shared.getPage.mockReturnValue(ref({ page_layout: 'default', current_user: { authenticated: false } }))
    const Harness = defineComponent({
      setup() {
        const context = usePageContext()

        return () => h('p', context.pageLayout.value)
      },
    })
    const wrapper = await mountSuspended(Harness)

    expect(wrapper.text()).toBe('default')
    expect(shared.getPage).toHaveBeenCalled()
    wrapper.unmount()
  })
})
