import { mountSuspended } from '@nuxt/test-utils/runtime'
import { afterEach, describe, expect, it } from 'vitest'
import { updateAppConfig, useAppConfig } from '#imports'
import App from '../../../layers/theme/app/app.vue'

// The shell is under test, not the routed page.
const stubs = { NuxtLayout: { template: '<main id="main-content"><slot /></main>' }, NuxtPage: true }

describe('app.vue embedded mode', () => {
  afterEach(() => {
    updateAppConfig({ stirTheme: { embedded: false } })
  })

  it('renders the skip link and route announcer by default', async () => {
    const wrapper = await mountSuspended(App, { global: { stubs } })

    expect(wrapper.find('a[href="#main-content"]').exists()).toBe(true)
    expect(wrapper.html()).toContain('nuxt-route-announcer')
    wrapper.unmount()
  })

  it('omits the app chrome when embedded in another site', async () => {
    updateAppConfig({ stirTheme: { embedded: true } })
    expect(useAppConfig().stirTheme.embedded).toBe(true)

    const wrapper = await mountSuspended(App, { global: { stubs } })

    expect(wrapper.find('a[href="#main-content"]').exists()).toBe(false)
    expect(wrapper.html()).not.toContain('nuxt-route-announcer')
    expect(wrapper.find('[aria-label="Skip links"]').exists()).toBe(false)
    wrapper.unmount()
  })
})
