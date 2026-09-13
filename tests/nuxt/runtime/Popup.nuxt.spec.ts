import { useAppConfig, useNuxtApp, useState } from '#imports'
import { mockNuxtImport, mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick, ref } from 'vue'
import Popup from '../../../layers/integrations/app/components/App/Popup.vue'
import { usePopupBehavior } from '../../../layers/integrations/app/composables/usePopupBehavior'

mockNuxtImport('usePopupData', () => () => ({
  popup: ref({ props: { id: 1, uuid: 'campaign' } }),
  config: ref({ trigger: 'delay', scrollThreshold: 0.5 }),
}))

const popupConfig = () => useAppConfig().popup as Record<string, unknown>
const findModal = (wrapper: Awaited<ReturnType<typeof mountSuspended>>) =>
  wrapper.findComponent({ name: 'UModal' })

let unregisterEndpoint: (() => void) | undefined
let resolveSession: (authenticated: boolean) => void = () => {}

beforeEach(() => {
  useState('auth-session-ready').value = false
  useState('auth-session-logged-in').value = false
  unregisterEndpoint = registerEndpoint('/api/auth/session', () =>
    new Promise(resolve => {
      resolveSession = authenticated => resolve({ authenticated, protectedAuthenticated: false, user: null })
    }))
})

afterEach(() => {
  popupConfig().hideWhenLoggedIn = false
  unregisterEndpoint?.()
})

describe('App popup', () => {
  it('renders without waiting for the session by default', async () => {
    const wrapper = await mountSuspended(Popup)

    await vi.waitFor(() => expect(findModal(wrapper).exists()).toBe(true))
    wrapper.unmount()
  })

  it('renders nothing before the session resolves, then shows for anonymous visitors', async () => {
    popupConfig().hideWhenLoggedIn = true

    const wrapper = await mountSuspended(Popup)

    await nextTick()
    expect(findModal(wrapper).exists()).toBe(false)
    resolveSession(false)
    await vi.waitFor(() => expect(findModal(wrapper).exists()).toBe(true))
    wrapper.unmount()
  })

  it('stays hidden for signed-in visitors', async () => {
    popupConfig().hideWhenLoggedIn = true

    const wrapper = await mountSuspended(Popup)

    resolveSession(true)
    await vi.waitFor(() => expect(useState('auth-session-ready').value).toBe(true))
    await nextTick()
    expect(findModal(wrapper).exists()).toBe(false)
    wrapper.unmount()
  })

  it('calls the stir:popup:shown hook once per show', async () => {
    const shown = vi.fn()
    const removeHook = useNuxtApp().hook('stir:popup:shown', shown)
    let open = ref(false)
    const Harness = defineComponent({
      setup() {
        open = usePopupBehavior({
          popup: ref({ props: { uuid: 'campaign' } }),
          config: ref({ trigger: 'delay', scrollThreshold: 0.5 }),
        }).open

        return () => null
      },
    })
    const wrapper = await mountSuspended(Harness)

    open.value = true
    await nextTick()
    open.value = true
    await nextTick()
    expect(shown).toHaveBeenCalledTimes(1)
    expect(shown).toHaveBeenCalledWith({ key: 'campaign', popup: { props: { uuid: 'campaign' } } })
    removeHook()
    wrapper.unmount()
  })
})
