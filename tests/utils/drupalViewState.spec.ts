import { describe, expect, it } from 'vitest'
import {
  cloneViewControlValues,
  createDefaultDrupalViewState,
  createViewStateSnapshot,
  createViewStateStorageKey,
  defaultDrupalViewFilterValue,
  firstViewControlString,
  parseStoredViewState,
  pruneStoredViewState,
  sanitizeDrupalViewStoredFilters,
  sanitizeDrupalViewStoredSorts,
} from '../../layers/theme/app/utils/drupalViewState'

const filters = [{
  label: 'Category',
  queryParamName: 'category',
  multiple: true,
  options: [
    { label: 'News', value: 'news' },
    { label: 'Events', value: 'events' },
  ],
}]

const exposedFilters = [{
  label: 'Category',
  queryParamName: 'category',
  submittedValues: ['news'],
}]

const sort = {
  label: 'Newest',
  sortByValue: 'created',
  submittedOrder: 'DESC',
  queryParamSortBy: 'sort_by',
  queryParamSortOrder: 'sort_order',
  sortOrderOptions: { ASC: 'Oldest', DESC: 'Newest' },
}

describe('Drupal view state', () => {
  it('builds a view-specific storage key', () => {
    expect(createViewStateStorageKey({
      path: '/articles',
      viewId: 'articles',
      displayId: 'page_1',
      parentUuid: 'parent',
    })).toBe('stir:view-controls:/articles:articles:page_1:parent')
    expect(createViewStateStorageKey({ path: '/' })).toBe('stir:view-controls:/:::')
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
    expect(parseStoredViewState(JSON.stringify({
      filters: null,
      sorts: {},
      savedAt: 900,
    }), 1000, 200)).toBeNull()
    expect(parseStoredViewState(JSON.stringify({
      filters: {},
      sorts: null,
      savedAt: 900,
    }), 1000, 200)).toBeNull()
    expect(parseStoredViewState(fresh, 1200, 200)).toBeNull()
  })

  it('prunes malformed, expired, and excess view storage records', () => {
    const values = new Map<string, string>([
      ['unrelated', 'keep'],
      ['stir:view-scroll:/expired:view:block:', JSON.stringify({ savedAt: 100 })],
      ['stir:view-controls:/broken:view:block:', '{'],
      ['stir:view-controls:/old:view:block:', JSON.stringify({ savedAt: 850 })],
      ['stir:view-scroll:/new:view:block:', JSON.stringify({ savedAt: 950 })],
    ])
    const storage = {
      get length() {
        return values.size
      },
      key(index: number) {
        return [...values.keys()][index] ?? null
      },
      getItem(key: string) {
        return values.get(key) ?? null
      },
      removeItem(key: string) {
        values.delete(key)
      },
    }

    pruneStoredViewState(storage, 1000, 200, 1)

    expect([...values.keys()]).toEqual([
      'unrelated',
      'stir:view-scroll:/new:view:block:',
    ])
  })

  it('normalizes scalar, array, missing, single, and multiple values', () => {
    expect(firstViewControlString(['first', 'second'])).toBe('first')
    expect(firstViewControlString([])).toBe('')
    expect(firstViewControlString('value')).toBe('value')
    expect(firstViewControlString(undefined)).toBe('')
    expect(defaultDrupalViewFilterValue({ multiple: false }, {
      label: 'Search',
      queryParamName: 'search',
      submittedValues: [42],
    })).toBe('42')
    expect(defaultDrupalViewFilterValue({ multiple: true })).toEqual([])
  })

  it('creates defaults from Drupal submitted filter and sort state', () => {
    expect(createDefaultDrupalViewState({
      filters,
      exposedFilters,
      sort,
      savedAt: 100,
    })).toEqual({
      filters: { category: ['news'] },
      sorts: { sort_by: 'created', sort_order: 'DESC' },
      page: 0,
      savedAt: 100,
    })

    expect(createDefaultDrupalViewState({
      filters: [],
      exposedFilters: [],
      sort: null,
      savedAt: 101,
    })).toEqual({ filters: {}, sorts: {}, page: 0, savedAt: 101 })
  })

  it('sanitizes stored controls against the current Drupal definitions', () => {
    expect(sanitizeDrupalViewStoredFilters({
      filters: { category: ['events'] },
      definitions: filters,
      exposedFilters,
    })).toEqual({ category: ['events'] })
    expect(sanitizeDrupalViewStoredFilters({
      definitions: filters,
      exposedFilters,
    })).toEqual({ category: ['news'] })

    expect(sanitizeDrupalViewStoredSorts({
      sorts: { sort_by: 'created', sort_order: 'ASC' },
      sort,
      sortByOptions: [{ value: 'created' }],
      sortOrderOptions: [{ value: 'ASC' }, { value: 'DESC' }],
    })).toEqual({ sort_by: 'created', sort_order: 'ASC' })
    expect(sanitizeDrupalViewStoredSorts({
      sort,
      sortByOptions: [{ value: 'created' }],
      sortOrderOptions: [{ value: 'ASC' }, { value: 'DESC' }],
    })).toEqual({ sort_by: 'created', sort_order: 'DESC' })
    expect(sanitizeDrupalViewStoredSorts({
      sort: null,
      sortByOptions: [],
      sortOrderOptions: [],
    })).toEqual({})
  })

  it('rejects stale or query-injection-shaped stored controls', () => {
    expect(sanitizeDrupalViewStoredFilters({
      filters: { category: ['archived'] },
      definitions: filters,
      exposedFilters,
    })).toBeNull()

    expect(sanitizeDrupalViewStoredSorts({
      sorts: { sort_by: 'created&category=events', sort_order: 'DESC' },
      sort,
      sortByOptions: [{ value: 'created' }],
      sortOrderOptions: [{ value: 'ASC' }, { value: 'DESC' }],
    })).toBeNull()
    expect(sanitizeDrupalViewStoredSorts({
      sorts: { sort_by: 'created', sort_order: 'sideways' },
      sort,
      sortByOptions: [{ value: 'created' }],
      sortOrderOptions: [{ value: 'ASC' }, { value: 'DESC' }],
    })).toBeNull()
  })
})
