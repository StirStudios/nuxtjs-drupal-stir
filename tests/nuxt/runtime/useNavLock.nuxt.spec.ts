import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h } from 'vue'
import { useNavLock } from '../../../layers/theme/app/composables/useNavLock'

const NavLockHarness = defineComponent({
  setup() {
    return useNavLock()
  },
  template: '<div />',
})

describe('useNavLock', () => {
  beforeEach(() => {
    useState<boolean>('nav-locked').value = false
    useState<number>('nav-lock-pending-count').value = 0
  })

  it('tracks the Nuxt page lifecycle through one shared plugin', async () => {
    const wrapper = await mountSuspended(NavLockHarness)
    const nuxtApp = useNuxtApp()

    await nuxtApp.callHook('page:loading:start')
    expect(wrapper.vm.locked).toBe(true)

    await nuxtApp.callHook('page:loading:end')
    expect(wrapper.vm.locked).toBe(false)

    await nuxtApp.callHook('page:loading:start')
    await nuxtApp.callHook('app:error', new Error('Navigation failed.'))
    expect(wrapper.vm.locked).toBe(false)

    wrapper.unmount()
  })

  it('locks before route-derived state changes', async () => {
    const wrapper = await mountSuspended(NavLockHarness)
    const nuxtApp = useNuxtApp()
    const router = useRouter()
    const routeName = 'nav-lock-timing-target'
    const routePath = '/nav-lock-timing-target'
    let lockedInsideGuard = false

    router.addRoute({
      name: routeName,
      path: routePath,
      component: defineComponent({
        render: () => h('div', 'Navigation target'),
      }),
    })

    const removeGuard = router.beforeEach(() => {
      lockedInsideGuard = wrapper.vm.locked
    })

    await router.push(routePath)

    expect(lockedInsideGuard).toBe(true)

    await nuxtApp.callHook('page:loading:end')

    removeGuard()
    router.removeRoute(routeName)
    wrapper.unmount()
  })

  it('stays locked while a superseding navigation is still pending', async () => {
    const wrapper = await mountSuspended(NavLockHarness)
    const nuxtApp = useNuxtApp()
    const router = useRouter()
    const firstRouteName = 'nav-lock-overlap-first'
    const secondRouteName = 'nav-lock-overlap-second'
    let releaseFirst: (() => void) | undefined
    let releaseSecond: (() => void) | undefined

    await nuxtApp.callHook('app:error', new Error('Reset navigation test state.'))

    router.addRoute({
      name: firstRouteName,
      path: '/nav-lock-overlap-first',
      component: defineComponent({ render: () => h('div', 'First target') }),
    })
    router.addRoute({
      name: secondRouteName,
      path: '/nav-lock-overlap-second',
      component: defineComponent({ render: () => h('div', 'Second target') }),
    })

    const removeGuard = router.beforeEach(to => new Promise<void>((resolve) => {
      if (to.name === firstRouteName) releaseFirst = resolve
      if (to.name === secondRouteName) releaseSecond = resolve
    }))

    const firstPush = router.push({ name: firstRouteName })

    await vi.waitFor(() => expect(releaseFirst).toBeTypeOf('function'))

    const secondPush = router.push({ name: secondRouteName })

    await vi.waitFor(() => expect(releaseSecond).toBeTypeOf('function'))

    releaseFirst?.()
    await firstPush

    expect(wrapper.vm.locked).toBe(true)

    releaseSecond?.()
    await secondPush
    await nuxtApp.callHook('page:loading:end')

    expect(wrapper.vm.locked).toBe(false)

    removeGuard()
    router.removeRoute(firstRouteName)
    router.removeRoute(secondRouteName)
    wrapper.unmount()
  })

  it('does not relock navigation when a later consumer mounts', async () => {
    const firstWrapper = await mountSuspended(NavLockHarness)

    await useNuxtApp().callHook('page:finish')
    const secondWrapper = await mountSuspended(NavLockHarness)

    expect(firstWrapper.vm.locked).toBe(false)
    expect(secondWrapper.vm.locked).toBe(false)

    firstWrapper.unmount()
    secondWrapper.unmount()
  })
})
