// @vitest-environment nuxt
import { describe, expect, it, vi } from 'vitest'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { refreshNuxtData, useNuxtApp, useState, watch } from '#imports'
import DrupalTabs from '../../../layers/editorial/app/components/Drupal/Tabs.vue'

describe('Drupal/Tabs account menu', () => {
  it('keeps the menu while another bar mounts or the menu refreshes', async () => {
    const nuxtApp = useNuxtApp()
    const requests = vi.fn(() => [
      { title: 'My account', relative: '/user' },
      { title: 'Log out', relative: '/user/logout' },
    ])
    const menuKey = 'menu-account--7'

    registerEndpoint('/api/menu/api/menu_items/account', requests)
    nuxtApp.payload.data['page-account-menu-proxy'] = {
      title: 'Editor page',
      content: {},
      current_user: { id: 7, authenticated: true, capabilities: { editorialUi: true } },
    }
    useState<string>('drupal-ce-current-page-key').value = 'page-account-menu-proxy'

    const first = await mountSuspended(DrupalTabs)

    await vi.waitFor(() => expect(nuxtApp.payload.data[menuKey]).toHaveLength(2))

    // Records every value the shared menu takes, including a momentary clear.
    const seen: unknown[] = []
    const stop = watch(() => nuxtApp.payload.data[menuKey], value => seen.push(value), { flush: 'sync' })

    // A second bar, such as one in a layout Nuxt builds during navigation,
    // and a data refresh must both reuse the menu in hand, never reset it.
    const second = await mountSuspended(DrupalTabs)

    await refreshNuxtData(menuKey)
    stop()

    expect(seen.every(value => Array.isArray(value) && value.length === 2)).toBe(true)
    expect(nuxtApp.payload.data[menuKey]).toHaveLength(2)
    expect(requests).toHaveBeenCalledTimes(1)

    first.unmount()
    second.unmount()
  })
})
