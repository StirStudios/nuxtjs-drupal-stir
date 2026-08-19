import { describe, expect, it } from 'vitest'
import { useAppConfig } from '#app'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import FieldTurnstile from '../../../layers/turnstile/app/components/Field/Turnstile.vue'

describe('Turnstile configuration', () => {
  it('defaults to the low-friction interaction-only appearance', () => {
    const appConfig = useAppConfig()

    expect(appConfig.stirTheme.turnstile.appearance).toBe('interaction-only')
  })

  it('clears failed verification and exposes an accessible error', async () => {
    const wrapper = await mountSuspended(FieldTurnstile, {
      global: {
        stubs: {
          LazyNuxtTurnstile: {
            name: 'LazyNuxtTurnstile',
            props: ['modelValue', 'options'],
            template: '<div />',
          },
        },
      },
    })
    const turnstile = wrapper.findComponent({ name: 'NuxtTurnstile' })
    const options = turnstile.props('options') as Record<string, () => unknown>

    expect(options['error-callback']?.()).toBe(true)
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('update:modelValue')).toContainEqual([''])
    expect(wrapper.get('[role="alert"]').text()).toContain(
      'Security verification could not be completed',
    )
  })
})
