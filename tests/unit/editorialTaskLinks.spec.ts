import { describe, expect, it, vi } from 'vitest'
import {
  type EditorialTaskLink,
  adminLinkIcon,
  withUnpublishedTask,
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
})
