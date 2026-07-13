import { beforeEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent } from 'vue'
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
  })

  it('tracks the Nuxt page lifecycle through one shared plugin', async () => {
    const wrapper = await mountSuspended(NavLockHarness)
    const nuxtApp = useNuxtApp()

    await nuxtApp.callHook('page:start')
    expect(wrapper.vm.locked).toBe(true)

    await nuxtApp.callHook('page:finish')
    expect(wrapper.vm.locked).toBe(false)

    await nuxtApp.callHook('page:start')
    await nuxtApp.callHook('app:error', new Error('Navigation failed.'))
    expect(wrapper.vm.locked).toBe(false)

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
