// @vitest-environment nuxt
import { describe, expect, it, vi } from 'vitest'
import { mockNuxtImport, mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import type { Router } from 'vue-router'
import { ref, useNuxtApp, useRouter, useState } from '#imports'
import DrupalTabs from '../../../layers/editorial/app/components/Drupal/Tabs.vue'

const authSession = vi.hoisted(() => ({ current: null as unknown }))

mockNuxtImport('useOptionalAuthSession', () => () => authSession.current)

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
    useState<string>('stir-page-current-key').value = 'page-stale-tasks'
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
    // staticRoutes drops addRoute from the router type; this test env allows it.
    ;(useRouter() as unknown as Router).addRoute({ path: '/instructors', name: 'instructors', component: { render: () => null } })
    const bar = await mountSuspended(DrupalTabs, { route: '/instructors' })

    expect(useRoute().meta.drupalPage).not.toBe(true)
    expect(bar.find('a[href*="/node/1/edit"]').exists()).toBe(false)
    expect(bar.text()).not.toContain('Revisions')
    expect(bar.text()).not.toContain('Unpublished')
    // The rest of the bar stays: the editor's account menu.
    expect(bar.text()).toContain('Editor')
    bar.unmount()
  })

  it('names the signed-in account on a page with no Drupal page user', async () => {
    registerEndpoint('/api/menu/api/menu_items/account', () => [])
    useNuxtApp().payload.data['page-no-user'] = { title: 'Courses', content: {} }
    useState<string>('stir-page-current-key').value = 'page-no-user'
    authSession.current = {
      ready: ref(true),
      loggedIn: ref(true),
      user: ref({ uid: 9, name: 'Session Editor', picture: '/files/avatar.jpg', capabilities: { editorialUi: true } }),
      fetchSession: async () => {},
    }
    ;(useRouter() as unknown as Router).addRoute({ path: '/courses', name: 'courses', component: { render: () => null } })
    const bar = await mountSuspended(DrupalTabs, { route: '/courses' })

    expect(bar.text()).toContain('Session Editor')
    expect(bar.text()).not.toContain('Account')
    expect(bar.html()).toContain('/files/avatar.jpg')
    bar.unmount()
    authSession.current = null
  })
})
