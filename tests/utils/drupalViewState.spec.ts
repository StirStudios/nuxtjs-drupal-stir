import { describe, expect, it } from 'vitest'
import {
  cloneViewControlValues,
  createViewStateSnapshot,
  createViewStateStorageKey,
  parseStoredViewState,
} from '../../layers/theme/app/utils/drupalViewState'

describe('Drupal view state', () => {
  it('builds a view-specific storage key', () => {
    expect(createViewStateStorageKey({
      path: '/articles',
      viewId: 'articles',
      displayId: 'page_1',
      parentUuid: 'parent',
    })).toBe('stir:view-controls:/articles:articles:page_1:parent')
  })

  it('clones array values when taking a snapshot', () => {
    const source = { category: ['one', 'two'], search: 'term' }
    const clone = cloneViewControlValues(source)
    const snapshot = createViewStateSnapshot(source, { order: 'ASC' }, 2, 100)

    source.category.push('three')

    expect(clone).toEqual({ category: ['one', 'two'], search: 'term' })
    expect(snapshot).toEqual({
      filters: { category: ['one', 'two'], search: 'term' },
      sorts: { order: 'ASC' },
      page: 2,
      savedAt: 100,
    })
  })

  it('accepts fresh state and rejects missing, malformed, or expired state', () => {
    const fresh = JSON.stringify({
      filters: { category: 'one' },
      sorts: {},
      page: 1,
      savedAt: 900,
    })

    expect(parseStoredViewState(fresh, 1000, 200)?.page).toBe(1)
    expect(parseStoredViewState(null, 1000, 200)).toBeNull()
    expect(parseStoredViewState('{', 1000, 200)).toBeNull()
    expect(parseStoredViewState('{}', 1000, 200)).toBeNull()
    expect(parseStoredViewState(fresh, 1200, 200)).toBeNull()
  })
})
