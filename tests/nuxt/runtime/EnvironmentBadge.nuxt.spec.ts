import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import EnvironmentBadge from '../../../layers/theme/app/components/App/EnvironmentBadge.vue'

describe('environment badge', () => {
  it.each([
    ['development', 'Development site, not production.'],
    ['staging', 'Staging site, not production.'],
    ['production', ''],
  ])('for %s shows "%s"', async (environment, text) => {
    useRuntimeConfig().public.environment = environment
    const wrapper = await mountSuspended(EnvironmentBadge)

    expect(wrapper.text()).toBe(text)
    wrapper.unmount()
  })
})
