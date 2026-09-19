import { afterEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, nextTick, ref } from 'vue'
import {
  registerAccountNavVisibility,
  useAccountNav,
} from '../../../layers/auth/app/composables/useAccountNav'

const state = vi.hoisted(() => ({
  appConfig: {} as Record<string, unknown>,
}))

mockNuxtImport('useAppConfig', () => () => state.appConfig)

const wrappers: Array<{ unmount: () => void }> = []

const mountNav = async (register?: () => void) => {
  let nav: ReturnType<typeof useAccountNav> | undefined
  const Harness = defineComponent({
    setup() {
      register?.()
      nav = useAccountNav()

      return () => null
    },
  })

  wrappers.push(await mountSuspended(Harness))

  if (!nav) throw new Error('Account nav composable was not initialized.')

  return nav
}

const labels = (nav: ReturnType<typeof useAccountNav>) =>
  nav.items.value.map(item => item.label)

const configuredItems = [
  { label: 'Settings', icon: 'i-lucide-settings', to: '/account/settings' },
  { label: 'Profile', icon: 'i-lucide-user-round', to: '/account/profile' },
  { label: 'Billing', icon: 'i-lucide-credit-card', to: '/account/billing', visibility: 'billing' },
]

describe('useAccountNav', () => {
  afterEach(() => {
    wrappers.splice(0).forEach(wrapper => wrapper.unmount())
    state.appConfig = {}
  })

  it('keeps the default Settings item without configuration', async () => {
    const nav = await mountNav()

    expect(nav.items.value).toEqual([
      { label: 'Settings', icon: 'i-lucide-settings', to: '/account/settings' },
    ])
  })

  it('renders configured items and hides a keyed item with no resolver', async () => {
    state.appConfig = { auth: { accountNav: { items: configuredItems } } }

    const nav = await mountNav()

    expect(labels(nav)).toEqual(['Settings', 'Profile'])
  })

  it('shows a keyed item while its registered resolver is true', async () => {
    state.appConfig = { auth: { accountNav: { items: configuredItems } } }

    const hasCustomer = ref(false)
    const resolver = vi.fn(() => hasCustomer)
    const nav = await mountNav(() => registerAccountNavVisibility('billing', resolver))

    expect(labels(nav)).toEqual(['Settings', 'Profile'])

    hasCustomer.value = true
    await nextTick()
    expect(labels(nav)).toEqual(['Settings', 'Profile', 'Billing'])
    expect(nav.items.value[2]).toEqual({
      label: 'Billing',
      icon: 'i-lucide-credit-card',
      to: '/account/billing',
    })
    expect(resolver).toHaveBeenCalledOnce()
  })

  it('accepts getter resolvers and skips resolvers the configuration does not use', async () => {
    state.appConfig = { auth: { accountNav: { items: configuredItems } } }

    const unused = vi.fn(() => true)
    const nav = await mountNav(() => {
      registerAccountNavVisibility('billing', () => () => true)
      registerAccountNavVisibility('unused', unused)
    })

    expect(labels(nav)).toEqual(['Settings', 'Profile', 'Billing'])
    expect(unused).not.toHaveBeenCalled()
  })
})
