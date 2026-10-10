// @vitest-environment nuxt
import { describe, expect, it } from 'vitest'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { useNuxtApp, useRuntimeConfig, useState } from '#imports'
import DrupalTabs from '../../../layers/editorial/app/components/Drupal/Tabs.vue'

describe('Drupal/Tabs environment badge', () => {
  it.each([
    ['development', 'Development site'],
    ['local', 'Local site'],
    ['production', null],
  ])('on %s shows %s', async (environment, label) => {
    registerEndpoint('/api/menu/api/menu_items/account', () => [])
    useNuxtApp().payload.data['page-environment-badge'] = {
      title: 'Editor page',
      content: {},
      current_user: { id: 9, name: 'Editor', authenticated: true, capabilities: { editorialUi: true } },
    }
    useState<string>('drupal-ce-current-page-key').value = 'page-environment-badge'
    useRuntimeConfig().public.environment = environment

    const bar = await mountSuspended(DrupalTabs)

    if (label) expect(bar.text()).toContain(label)
    else expect(bar.text()).not.toMatch(/ site\b/)
    bar.unmount()
  })
})
