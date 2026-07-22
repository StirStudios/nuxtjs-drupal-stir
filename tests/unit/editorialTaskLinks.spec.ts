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

  it('leaves published pages and task lists without View unchanged', () => {
    const links = buildLinks()
    const withoutView = links.slice(1)

    expect(withUnpublishedTask(links, true)).toBe(links)
    expect(withUnpublishedTask(withoutView, false)).toEqual(withoutView)
  })
})
