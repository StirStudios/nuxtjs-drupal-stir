// @vitest-environment nuxt
import { describe, expect, it, vi } from 'vitest'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { useNuxtApp, useState } from '#imports'
import DrupalTabs from '../../../layers/editorial/app/components/Drupal/Tabs.vue'

const sections = [
  { title: 'Dashboard', url: '/admin/dashboard', description: '', children: [] },
  {
    title: 'Content',
    url: '/admin/content',
    description: '',
    children: [{ title: 'Add content', url: '/node/add', description: '' }],
  },
]

const mountBar = async (pageKey: string, capabilities: Record<string, boolean>) => {
  registerEndpoint('/api/menu/api/menu_items/account', () => [])
  useNuxtApp().payload.data[pageKey] = {
    title: 'Editor page',
    content: {},
    current_user: {
      id: 5,
      name: 'Editor',
      authenticated: true,
      capabilities,
      admin_dashboard_url: '/admin/dashboard',
    },
  }
  useState<string>('drupal-ce-current-page-key').value = pageKey

  return mountSuspended(DrupalTabs)
}

const drupalCms = (bar: Awaited<ReturnType<typeof mountBar>>) =>
  bar.findAll('a, button').find(item => item.text().includes('Drupal CMS'))

describe('Drupal/Tabs administration menu', () => {
  it('keeps Drupal CMS a dashboard link for editors without the menu', async () => {
    const requests = vi.fn(() => ({ sections }))

    registerEndpoint('/api/admin-menu', requests)

    const bar = await mountBar('page-admin-menu-editor', { editorialUi: true })
    const item = drupalCms(bar)

    expect(item?.element.tagName).toBe('A')
    expect(item?.attributes('href')).toContain('/admin/dashboard')
    expect(requests).not.toHaveBeenCalled()
    bar.unmount()
  })

  it('opens Drupal\'s sections from Drupal CMS, loading them only then', async () => {
    const requests = vi.fn(() => ({ sections }))

    registerEndpoint('/api/admin-menu', requests)

    const bar = await mountBar('page-admin-menu-admin', { editorialUi: true, adminMenu: true })
    const item = drupalCms(bar)

    expect(item?.element.tagName).toBe('BUTTON')
    expect(requests).not.toHaveBeenCalled()

    await item?.trigger('click')

    await vi.waitFor(() => {
      const panel = document.body.querySelector('[role="dialog"]')

      expect(panel?.getAttribute('aria-describedby')).toBeTruthy()
      expect(panel?.querySelector('h2')?.textContent).toBe('Drupal CMS')
      expect(panel?.textContent).toContain('Dashboard')
      expect(panel?.textContent).toContain('Content')
    })
    expect(requests).toHaveBeenCalledTimes(1)

    const dashboard = [...document.body.querySelectorAll('[role="dialog"] a')]
      .find(link => link.textContent?.includes('Dashboard'))

    // Each link goes through the bar's own Drupal link handling.
    expect(dashboard?.getAttribute('href')).toContain('/admin/dashboard')
    bar.unmount()
  })

  it('toggles the panel with Shift+Alt+D', async () => {
    registerEndpoint('/api/admin-menu', () => ({ sections }))

    const bar = await mountBar('page-admin-menu-shortcut', { editorialUi: true, adminMenu: true })
    const panelState = () => document.body.querySelector('[role="dialog"]')?.getAttribute('data-state') ?? 'closed'
    const pressShortcut = () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Î', code: 'KeyD', altKey: true, shiftKey: true, bubbles: true }))

    pressShortcut()
    await vi.waitFor(() => expect(panelState()).toBe('open'))

    pressShortcut()
    await vi.waitFor(() => expect(panelState()).toBe('closed'))
    bar.unmount()
  })
})
