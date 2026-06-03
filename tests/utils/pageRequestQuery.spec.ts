import { describe, expect, it } from 'vitest'
import { sanitizePageRequestQuery } from '../../layers/theme/app/utils/pageRequest'

describe('sanitizePageRequestQuery', () => {
  it('keeps valid view query values', () => {
    expect(sanitizePageRequestQuery({
      page: '1',
      sort_by: 'title',
      sort_order: 'ASC',
    })).toEqual({
      page: '1',
      sort_by: 'title',
      sort_order: 'ASC',
    })
  })

  it('removes values with embedded query fragments', () => {
    expect(sanitizePageRequestQuery({
      page: '1',
      sort_by: 'title?sort_order=ASC',
    })).toEqual({
      page: '1',
    })
  })

  it('removes malformed values from query arrays', () => {
    expect(sanitizePageRequestQuery({
      category: ['dance', 'ballet?page=1'],
    })).toEqual({
      category: ['dance'],
    })
  })
})
