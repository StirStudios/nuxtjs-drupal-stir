import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { clearNuxtData } from '#app'
import { defineComponent } from 'vue'
import { useAuthConfig } from '../../../layers/auth/app/composables/auth/useAuthConfig'

describe('useAuthConfig', () => {
  let authConfigCalls = 0
  let unregisterEndpoint: (() => void) | undefined

  beforeEach(() => {
    authConfigCalls = 0
    clearNuxtData('stir-auth-ui-config')
    unregisterEndpoint = registerEndpoint('/api/auth/config', async () => {
      authConfigCalls++
      await new Promise(resolve => setTimeout(resolve, 10))

      return {
        version: 2,
        accountsEnabled: true,
        loginRedirectPath: '/account',
      }
    })
  })

  afterEach(() => {
    unregisterEndpoint?.()
    unregisterEndpoint = undefined
    clearNuxtData('stir-auth-ui-config')
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
