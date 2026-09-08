import { describe, expect, it } from 'vitest'
import { omitDrupalViewSortDefaults } from '../../layers/theme/app/composables/useDrupalViewQuery'

const sort = {
  queryParamSortBy: 'sort_by', queryParamSortOrder: 'sort_order',
  defaultSortBy: 'title', defaultOrder: 'ASC', submittedOrder: 'DESC',
}

describe('Drupal-declared public URL defaults', () => {
  it('omits only matching configured defaults, preserving controls and tokens', () => {
    const query = { sort_by: 'title', sort_order: 'asc', page: '2', category: 'news', stir_order_podcast: '600' }

    expect(omitDrupalViewSortDefaults(query, sort)).toEqual({ page: '2', category: 'news', stir_order_podcast: '600' })
    expect(query.sort_by).toBe('title')
  })

  it('retains changed sorting and never infers defaults from submitted values', () => {
    expect(omitDrupalViewSortDefaults({ sort_by: 'title', sort_order: 'DESC' }, sort)).toEqual({ sort_order: 'DESC' })
    const query = { sort_by: 'created', sort_order: 'ASC' }

    expect(omitDrupalViewSortDefaults(query, sort)).toEqual(query)
    expect(omitDrupalViewSortDefaults(query, { submittedOrder: 'ASC', sortByValue: 'created' })).toEqual(query)
  })
})
