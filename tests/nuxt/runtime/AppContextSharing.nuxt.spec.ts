import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { defineComponent } from 'vue'
import { clearNuxtData } from '#app'
import { useAuthActions } from '../../../layers/auth/app/composables/auth/useAuthActions'
import { useAppContext, useAppFooterContext, useAppRegionBlocks } from '../../../layers/theme/app/composables/useAppContext'

describe('shared app context', () => {
  let calls = 0
  let unregister: () => void
  const wrappers: Array<{ unmount: () => void }> = []

  beforeEach(() => {
    clearNuxtData()
    calls = 0
    unregister = registerEndpoint('/api/app-context', () => {
      calls++
      return {
        blocks: { top: [{ element: 'paragraph-text', props: { text: String(calls) } }] },
        footer_menu: [],
        site_info: { name: 'Fixture', mail: '', slogan: '' },
      }
    })
  })

  afterEach(() => {
    wrappers.splice(0).forEach(wrapper => wrapper.unmount())
    unregister()
    clearNuxtData()
  })

  it('reuses a completed request across full, footer and region consumers without a CE payload', async () => {
    const Full = defineComponent({
      async setup() {
        const result = await useAppContext()

        return { result }
      },
      template: '<div />',
    })
    const Footer = defineComponent({
      async setup() {
        const result = await useAppFooterContext({ immediate: false })

        if (result.status.value !== 'success') await result.execute()
        return { result }
      },
      template: '<div />',
    })
    const Region = defineComponent({
      async setup() {
        const result = await useAppRegionBlocks('top', { immediate: false })

        if (result.status.value !== 'success') await result.execute()
        return { result }
      },
      template: '<div />',
    })

    wrappers.push(await mountSuspended(Full))
    const footer = await mountSuspended(Footer)

    wrappers.push(footer)
    const region = await mountSuspended(Region)

    wrappers.push(region)

    expect(calls).toBe(1)
    expect(footer.vm.result.data.value?.site_info.name).toBe('Fixture')
    expect(region.vm.result.data.value?.[0]?.props?.text).toBe('1')
    await region.vm.result.refresh()
    expect(calls).toBe(2)
    expect(region.vm.result.data.value?.[0]?.props?.text).toBe('2')
  })

  it('refreshes shared context after login and logout on the same page', async () => {
    const endpoints = [
      registerEndpoint('/api/auth/login', { method: 'POST', handler: () => ({}) }),
      registerEndpoint('/api/auth/logout', { method: 'POST', handler: () => ({}) }),
      registerEndpoint('/api/auth/session', () => ({ authenticated: true, user: { roles: ['authenticated'] } })),
    ]

    try {
      const Harness = defineComponent({
        async setup() {
          const actions = useAuthActions()
          const result = await useAppContext()

          return { actions, result }
        },
        template: '<div />',
      })
      const wrapper = await mountSuspended(Harness)

      wrappers.push(wrapper)
      expect(calls).toBe(1)
      await wrapper.vm.actions.login({ identifier: 'fixture', password: 'fixture' })
      expect(calls).toBe(2)
      await wrapper.vm.actions.logout()
      expect(calls).toBe(3)
    } finally {
      endpoints.forEach(remove => remove())
    }
  })

})
