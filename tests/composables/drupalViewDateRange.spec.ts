import { describe, expect, it } from 'vitest'
import {
  buildDrupalViewControlQuery,
  normalizeDrupalViewFilters,
} from '../../layers/theme/app/composables/useDrupalViewQuery'
import { defaultDrupalViewFilterValue } from '../../layers/theme/app/utils/drupalViewState'

// A Views "between" date filter: Drupal reads the two values as min and max.
const [filter] = normalizeDrupalViewFilters([{
  label: 'Week',
  queryParamName: 'when',
  type: 'date_range',
  options: {},
  submittedValues: ['2026-10-26', '2026-11-02'],
}])

describe('date range View filters', () => {
  it('keep the start and the end from Drupal', () => {
    expect(filter?.multiple).toBe(true)
    expect(defaultDrupalViewFilterValue(filter!, {
      label: 'Week',
      queryParamName: 'when',
      type: 'date_range',
      options: {},
      submittedValues: ['2026-10-26', '2026-11-02'],
    })).toEqual(['2026-10-26', '2026-11-02'])
  })

  it('send both dates in the refresh request', () => {
    expect(buildDrupalViewControlQuery({
      filters: [filter!],
      filterValues: { when: ['2026-10-26', '2026-11-02'] },
      sort: null,
      sortValues: {},
      sortByOptions: [],
      sortOrderOptions: [],
      page: 0,
    })).toMatchObject({ 'when[]': ['2026-10-26', '2026-11-02'] })
  })
})
