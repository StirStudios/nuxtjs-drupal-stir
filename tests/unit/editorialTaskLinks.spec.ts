import { describe, expect, it, vi } from 'vitest'
import {
  type EditorialTaskLink,
  withUnpublishedTask,
} from '../../layers/editorial/app/utils/adminUiTheme'

function buildLinks(): EditorialTaskLink[] {
  return [
    {
      label: 'View',
      to: '/node/42',
      icon: 'i-lucide-eye',
      tooltip: false,
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
  it('inserts an unpublished edit shortcut before Edit', () => {
    const links = buildLinks()
    const result = withUnpublishedTask(links, false)

    expect(result.map(link => link.label)).toEqual([
      'View',
      'Unpublished',
      'Edit',
    ])
    expect(result[1]).toMatchObject({
      to: '/node/42/edit',
      icon: 'i-lucide-eye-off',
      class: 'admin-ui-unpublished-link',
      active: false,
    })
    expect(result[1]?.onSelect).toBe(links[1]?.onSelect)
    expect(links.map(link => link.label)).toEqual(['View', 'Edit'])
  })

  it('leaves published pages and pages without an edit task unchanged', () => {
    const links = buildLinks()
    const withoutEdit = links.slice(0, 1)

    expect(withUnpublishedTask(links, true)).toBe(links)
    expect(withUnpublishedTask(withoutEdit, false)).toBe(withoutEdit)
  })
})
