import { useAppConfig, useNuxtApp, useState } from '#imports'
import { mockNuxtImport, mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick, ref } from 'vue'
import Popup from '../../../layers/integrations/app/components/App/Popup.vue'
import { usePopupBehavior } from '../../../layers/integrations/app/composables/usePopupBehavior'

const popupData = ref<Record<string, unknown>>({ props: { id: 1, uuid: 'campaign' } })

mockNuxtImport('usePopupData', () => () => ({
  popup: popupData,
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

  describe('presentation', () => {
    const findDrawer = (wrapper: Awaited<ReturnType<typeof mountSuspended>>) =>
      wrapper.findComponent({ name: 'UDrawer' })
    const originalMatchMedia = window.matchMedia
    const setPhone = (matches: boolean) => {
      window.matchMedia = ((query: string) => ({
        matches: query.includes('max-width') && matches,
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
      })) as unknown as typeof window.matchMedia
    }

    afterEach(() => {
      window.matchMedia = originalMatchMedia
      delete popupConfig().mobilePresentation
    })

    it('keeps the modal on phones by default', async () => {
      setPhone(true)

      const wrapper = await mountSuspended(Popup)

      await vi.waitFor(() => expect(findModal(wrapper).exists()).toBe(true))
      expect(findDrawer(wrapper).exists()).toBe(false)
      wrapper.unmount()
    })

    it('renders a bottom drawer below md when opted in', async () => {
      popupConfig().mobilePresentation = 'drawer'
      setPhone(true)

      const wrapper = await mountSuspended(Popup)

      await vi.waitFor(() => expect(findDrawer(wrapper).exists()).toBe(true))
      const drawer = findDrawer(wrapper)

      expect(drawer.props('direction')).toBe('bottom')
      expect(drawer.props('close')).toBe(true)
      expect(drawer.props('title')).toBe('Announcement')
      expect(drawer.props('ui')).toMatchObject({ content: 'popup-drawer', description: 'sr-only', container: 'max-h-[50dvh]' })
      expect(drawer.props('ui')).not.toHaveProperty('title')
      expect(findModal(wrapper).exists()).toBe(false)
      wrapper.unmount()
    })

    it('keeps the modal at md and up when opted in', async () => {
      popupConfig().mobilePresentation = 'drawer'
      setPhone(false)

      const wrapper = await mountSuspended(Popup)

      await vi.waitFor(() => expect(findModal(wrapper).exists()).toBe(true))
      expect(findDrawer(wrapper).exists()).toBe(false)
      wrapper.unmount()
    })
  })

  describe('title', () => {
    afterEach(() => {
      delete popupConfig().title
      popupData.value = { props: { id: 1, uuid: 'campaign' } }
    })

    it('uses popup.title when the webform has no title', async () => {
      popupConfig().title = 'News'

      const wrapper = await mountSuspended(Popup)

      await vi.waitFor(() => expect(findModal(wrapper).props('title')).toBe('News'))
      wrapper.unmount()
    })

    it('prefers the webform title and skips blank values', async () => {
      popupConfig().title = '  '
      popupData.value = { props: { id: 1, uuid: 'campaign', webform: { webformTitle: 'Join us' } } }

      const wrapper = await mountSuspended(Popup)

      await vi.waitFor(() => expect(findModal(wrapper).props('title')).toBe('Join us'))
      popupData.value = { props: { id: 1, uuid: 'campaign', webform: { webformTitle: ' ' } } }
      await vi.waitFor(() => expect(findModal(wrapper).props('title')).toBe('Announcement'))
      wrapper.unmount()
    })
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
