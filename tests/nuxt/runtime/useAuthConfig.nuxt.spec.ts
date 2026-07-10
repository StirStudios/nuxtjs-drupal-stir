import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport, mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { clearNuxtData } from '#app'
import { defineComponent } from 'vue'
import { useAuthConfig } from '../../../layers/auth/app/composables/auth/useAuthConfig'

const state = vi.hoisted(() => ({
  drupalAccounts: true,
}))

mockNuxtImport('useAppConfig', () => {
  return () => ({
    authIntegration: {
      drupalAccounts: state.drupalAccounts,
    },
    colorMode: {
      forced: false,
      preference: 'system',
      showToggle: true,
      lightRoutes: [],
      darkRoutes: [],
    },
    ui: {
      colors: {
        neutral: 'slate',
        primary: 'green',
      },
      prefix: 'ui',
    },
    icon: {
      provider: 'local',
    },
  })
})

describe('useAuthConfig', () => {
  let authConfigCalls = 0
  let unregisterEndpoint: (() => void) | undefined

  beforeEach(() => {
    authConfigCalls = 0
    state.drupalAccounts = true
    clearNuxtData('stir-auth-ui-config')
    unregisterEndpoint = registerEndpoint('/api/auth/config', async () => {
      authConfigCalls++
      await new Promise(resolve => setTimeout(resolve, 10))

      return {
        loginRedirectPath: '/account',
      }
    })
  })

  afterEach(() => {
    unregisterEndpoint?.()
    unregisterEndpoint = undefined
    clearNuxtData('stir-auth-ui-config')
    state.drupalAccounts = false
  })

  it('dedupes concurrent auth config requests', async () => {
    const ConcurrentAuthConfig = defineComponent({
      setup() {
        for (let call = 0; call < 7; call++) {
          useAuthConfig()
        }

        return () => null
      },
    })

    const wrapper = await mountSuspended(ConcurrentAuthConfig)

    await vi.waitFor(() => expect(authConfigCalls).toBe(1))
    wrapper.unmount()
  })

})
