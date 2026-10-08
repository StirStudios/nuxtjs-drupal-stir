import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { clearNuxtData } from '#app'
import { flushPromises } from '@vue/test-utils'
import ProtectedPage from '../../../layers/auth/app/pages/auth/protected.vue'

async function mountWithConfig(protectedPage: Record<string, string>) {
  clearNuxtData('stir-auth-ui-config')
  registerEndpoint('/api/auth/config', () => ({ version: 2, accountsEnabled: true, protectedPage }))

  const wrapper = await mountSuspended(ProtectedPage)

  await flushPromises()

  return wrapper
}

describe('Protected page (Nuxt runtime)', () => {
  afterEach(() => {
    clearNuxtData('stir-auth-ui-config')
  })

  it('labels its button with the submit label set in Drupal', async () => {
    const wrapper = await mountWithConfig({ submitLabel: 'Enter' })

    expect(wrapper.get('button[type="submit"]').text()).toBe('Enter')
  })

  it('labels its button Continue when Drupal sets none', async () => {
    const wrapper = await mountWithConfig({})

    expect(wrapper.get('button[type="submit"]').text()).toBe('Continue')
  })
})
