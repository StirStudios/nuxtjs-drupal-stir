import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import {
  type EditorialTaskLink,
  adminLinkIcon,
  withUnpublishedTask,
  ADMIN_TAB_ICONS,
  toIconifyName,
} from '../../layers/editorial/app/utils/adminUiTheme'

function buildLinks(): EditorialTaskLink[] {
  return [
    {
      label: 'View',
      to: '/node/42',
      icon: 'i-lucide-eye',
      tooltip: false,
      active: true,
    },
    {
      label: 'Edit',
      to: '/node/42/edit',
      icon: 'i-lucide-square-pen',
      tooltip: false,
      onSelect: vi.fn(),
    },
  ]
}

describe('withUnpublishedTask', () => {
  it('replaces View with the unpublished page status', () => {
    const links = buildLinks()
    const result = withUnpublishedTask(links, false)

    expect(result.map(link => link.label)).toEqual(['Unpublished', 'Edit'])
    expect(result[0]).toMatchObject({
      to: '/node/42',
      icon: 'i-lucide-eye-off',
      class: 'admin-ui-unpublished-link',
    })
    expect(links.map(link => link.label)).toEqual(['View', 'Edit'])
  })

  it('finds the active task by Drupal state, not its English label', () => {
    const links = buildLinks().map(link =>
      link.active ? { ...link, label: 'Ver' } : link,
    )

    expect(withUnpublishedTask(links, false)[0]?.label).toBe('Unpublished')
  })

  it('leaves published pages and task lists without View unchanged', () => {
    const links = buildLinks()
    const withoutView = links.slice(1)

    expect(withUnpublishedTask(links, true)).toBe(links)
    expect(withUnpublishedTask(withoutView, false)).toEqual(withoutView)
  })
})

describe('adminLinkIcon', () => {
  it.each([
    ['https://cms.example.com/node/42/edit', 'i-lucide-square-pen'],
    ['/node/42/delete', 'i-lucide-trash'],
    ['/node/42/revisions/', 'i-lucide-history'],
    ['/ce-api/about', 'i-lucide-braces'],
    ['/user/logout?token=abc', 'i-lucide-log-out'],
    ['/user/login', 'i-lucide-log-in'],
    ['/user/7', 'i-lucide-circle-user'],
    ['/user', 'i-lucide-circle-user'],
  ])('maps %s to %s', (url, icon) => {
    expect(adminLinkIcon(url)).toBe(icon)
  })

  it('returns null for links with no known shape', () => {
    expect(adminLinkIcon('/node/42')).toBeNull()
    expect(adminLinkIcon('/admin/content')).toBeNull()
  })

  it('preloads every editor tab icon outside the shared icon bundle', () => {
    const urls = [
      'https://cms.example/ce-api/node/1', '/node/1/edit', '/node/1/delete', '/node/1/revisions',
      '/node/1/export', '/admin/settings', '/user/logout', '/user/login', '/user/7',
    ]

    for (const url of urls) {
      expect(ADMIN_TAB_ICONS).toContain(adminLinkIcon(url))
    }
    expect(ADMIN_TAB_ICONS).toEqual(expect.arrayContaining([
      'i-lucide-eye', 'i-lucide-eye-off', 'i-lucide-layout-dashboard', 'i-lucide-circle-user',
    ]))
    expect(toIconifyName('i-lucide-square-pen')).toBe('lucide:square-pen')

    const root = resolve(import.meta.dirname, '../..')

    expect(readFileSync(resolve(root, 'layers/editorial/app/components/Drupal/Tabs.vue'), 'utf8'))
      .toContain('onMounted(() => loadIcons(ADMIN_TAB_ICONS.map(toIconifyName)))')
    // Editor-only icons stay out of the bundle every visitor downloads.
    expect(readFileSync(resolve(root, 'layers/platform/nuxt.config.ts'), 'utf8')).not.toContain('lucide:square-pen')
  })
})
