import { describe, expect, it, vi } from 'vitest'
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

  it('collapses only inactive Webform spacing', async () => {
    const wrapper = await mountSuspended(FieldTurnstile, {
      props: { collapseWhenInactive: true },
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

    expect(wrapper.classes()).toContain('mb-0!')

    options['before-interactive-callback']?.()
    await wrapper.vm.$nextTick()
    expect(wrapper.classes()).not.toContain('mb-0!')

    options['after-interactive-callback']?.()
    await wrapper.vm.$nextTick()
    expect(wrapper.classes()).toContain('mb-0!')
  })

  it('requests a fresh token when the form clears a spent one', async () => {
    const reset = vi.fn()
    const widgetStub = {
      name: 'NuxtTurnstile',
      props: ['modelValue', 'options'],
      setup: (_props: unknown, { expose }: { expose: (exposed: object) => void }) => {
        expose({ reset })
      },
      template: '<div />',
    }
    const wrapper = await mountSuspended(FieldTurnstile, {
      props: { modelValue: 'spent-token' },
      global: {
        stubs: { LazyNuxtTurnstile: widgetStub, NuxtTurnstile: widgetStub },
      },
    })

    await wrapper.setProps({ modelValue: '' })
    expect(reset).toHaveBeenCalledOnce()

    await wrapper.setProps({ modelValue: 'fresh-token' })
    const options = wrapper.findComponent({ name: 'NuxtTurnstile' })
      .props('options') as Record<string, () => unknown>

    // Expiry is handled by the widget itself, so it must not reset twice.
    options['expired-callback']?.()
    await wrapper.setProps({ modelValue: '' })
    expect(reset).toHaveBeenCalledOnce()
  })
})
