import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h, ref } from 'vue'
import { usePageContext } from '../../../layers/theme/app/composables/usePageContext'

const shared = vi.hoisted(() => ({ getPage: vi.fn() }))
const hoistedFetchSession = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))

mockNuxtImport('useStirDrupalCe', () => () => ({ getPage: shared.getPage }))
vi.mock('../../../layers/auth/app/composables/useAuthSession', () => ({
  useAuthSession: () => authSession,
}))

const authSession = {
  fetchSession: hoistedFetchSession,
  loggedIn: ref(false),
  user: ref<{ uid: string, roles: string[] } | null>(null),
}

const setServerRendered = (value: boolean) => {
  useNuxtApp().payload.serverRendered = value
}

type DrupalPageValue = NonNullable<Parameters<typeof usePageContext>[0]>['value']

const createPage = (
  overrides: Partial<DrupalPageValue> = {},
): DrupalPageValue => ({
  title: 'Destination',
  settings: {},
  breadcrumbs: [],
  content_format: 'json',
  local_tasks: { primary: [], secondary: [] },
  messages: [],
  metatags: { meta: [], link: [], jsonld: [] },
  page_layout: 'clear',
  is_front_page: false,
  current_user: { authenticated: false },
  ...overrides,
})

describe('page-local Drupal context', () => {
  beforeEach(() => {
    authSession.loggedIn.value = false
    authSession.user.value = null
    hoistedFetchSession.mockClear()
  })

  it('uses the supplied page and follows its refresh without reading shared page state', async () => {
    const localPage = ref(createPage({ current_user: { authenticated: true } }))
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

  it('keeps editorial access for an administrator session on a mixed route with no local tasks', async () => {
    authSession.loggedIn.value = true
    authSession.user.value = { uid: '1', roles: ['administrator'] }
    const localPage = ref(createPage())
    const Harness = defineComponent({
      setup() {
        // A Drupal session cookie disables SSR, so an editor always arrives
        // through a client-only render.
        setServerRendered(false)

        const context = usePageContext(localPage)

        return () => h('p', `${context.isAdministrator.value}:${context.hasEditorialAccess.value}`)
      },
    })

    const wrapper = await mountSuspended(Harness)

    expect(wrapper.text()).toBe('true:true')
    expect(authSession.fetchSession).toHaveBeenCalled()
    wrapper.unmount()
  })

  it('never requests a session on a server-rendered public page', async () => {
    const localPage = ref(createPage())
    const Harness = defineComponent({
      setup() {
        setServerRendered(true)

        const context = usePageContext(localPage)

        return () => h('p', `${context.isAdministrator.value}:${context.hasEditorialAccess.value}`)
      },
    })

    const wrapper = await mountSuspended(Harness)

    expect(wrapper.text()).toBe('false:false')
    expect(authSession.fetchSession).not.toHaveBeenCalled()
    wrapper.unmount()
  })
})
