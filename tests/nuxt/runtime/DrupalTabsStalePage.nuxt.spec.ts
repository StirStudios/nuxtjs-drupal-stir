// @vitest-environment nuxt
import { describe, expect, it } from 'vitest'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { useNuxtApp, useRouter, useState } from '#imports'
import DrupalTabs from '../../../layers/editorial/app/components/Drupal/Tabs.vue'

// Drupal's page data stays in state after a client navigation to a page the
// site builds in Nuxt, so that page must not show the last node's tasks.
describe('Drupal/Tabs page tasks', () => {
  const lastNode = () => {
    registerEndpoint('/api/menu/api/menu_items/account', () => [])
    useNuxtApp().payload.data['page-stale-tasks'] = {
      title: 'A class',
      content: {},
      published: false,
      local_tasks: {
        primary: [
          { label: 'View', url: '/classes/a-class', active: true },
          { label: 'Edit', url: '/node/1/edit' },
          { label: 'Revisions', url: '/node/1/revisions' },
        ],
        secondary: [],
      },
      current_user: { id: 9, name: 'Editor', authenticated: true, capabilities: { editorialUi: true } },
    }
    useState<string>('drupal-ce-current-page-key').value = 'page-stale-tasks'
  }

  it('shows them on a Drupal page', async () => {
    lastNode()
    const bar = await mountSuspended(DrupalTabs, { route: '/classes/a-class' })

    expect(bar.find('a[href*="/node/1/edit"]').exists()).toBe(true)
    expect(bar.text()).toContain('Revisions')
    expect(bar.text()).toContain('Unpublished')
    bar.unmount()
  })

  it('leaves them off a page the site builds in Nuxt', async () => {
    lastNode()
    // A page the site builds in Nuxt, like /instructors.
    useRouter().addRoute({ path: '/instructors', name: 'instructors', component: { render: () => null } })
    const bar = await mountSuspended(DrupalTabs, { route: '/instructors' })

    expect(useRoute().meta.drupalPage).not.toBe(true)
    expect(bar.find('a[href*="/node/1/edit"]').exists()).toBe(false)
    expect(bar.text()).not.toContain('Revisions')
    expect(bar.text()).not.toContain('Unpublished')
    // The rest of the bar stays: the editor's account menu.
    expect(bar.text()).toContain('Editor')
    bar.unmount()
  })
})
