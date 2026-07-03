import { describe, expect, it } from 'vitest'
import type { CustomElementNode } from '../../layers/theme/app/types'
import {
  buildDrupalViewSearchParams,
  isSafeDrupalViewControlValue,
  isValidDrupalViewFilterValue,
  mapDrupalViewFilterOptions,
  normalizeDrupalViewPager,
  normalizeDrupalViewSortOrderValue,
} from '../../layers/theme/app/composables/useDrupalViewQuery'
import {
  findDrupalViewNode,
  findDrupalViewNodeInResponse,
  getDrupalViewNodeRows,
} from '../../layers/theme/app/composables/useDrupalViewNode'
import {
  drupalViewLoadErrorMessage,
  isDrupalViewAbortError,
} from '../../layers/theme/app/composables/useDrupalViewErrors'

describe('useDrupalViewControls helpers', () => {
  it('normalizes Drupal exposed filter option shapes', () => {
    expect(mapDrupalViewFilterOptions(['News', 'Events'])).toEqual([
      { label: 'News', value: '0' },
      { label: 'Events', value: '1' },
    ])

    expect(mapDrupalViewFilterOptions({ news: 'News', events: 'Events' })).toEqual([
      { label: 'News', value: 'news' },
      { label: 'Events', value: 'events' },
    ])
  })

  it('serializes view query params with repeated values for arrays', () => {
    const params = buildDrupalViewSearchParams({
      category: ['news', 'events'],
      page: '2',
    })

    expect(params.getAll('category')).toEqual(['news', 'events'])
    expect(params.get('page')).toBe('2')
  })

  it('normalizes sort order values for Drupal view requests', () => {
    expect(normalizeDrupalViewSortOrderValue('asc')).toBe('ASC')
    expect(normalizeDrupalViewSortOrderValue('DESC')).toBe('DESC')
    expect(normalizeDrupalViewSortOrderValue('custom')).toBe('custom')
  })

  it('normalizes Drupal pager shapes', () => {
    expect(normalizeDrupalViewPager({ current: '1', total_pages: '3' })).toEqual({
      current: 1,
      totalPages: 3,
    })
    expect(normalizeDrupalViewPager({ current: 2, totalPages: 4 })).toEqual({
      current: 2,
      totalPages: 4,
    })
    expect(normalizeDrupalViewPager({ current: 0 })).toBeNull()
  })

  it('finds matching view nodes nested in custom element slots', () => {
    const row = { element: 'node-article-teaser', props: { id: 1 } }
    const view: CustomElementNode = {
      element: 'drupal-view-default',
      props: {
        viewId: 'testimonials',
        displayId: 'block_1',
        parentUuid: 'paragraph-1',
      },
      slots: {
        rows: [row],
      },
    }
    const page = {
      element: 'node-page',
      slots: {
        section: [
          {
            element: 'paragraph-view',
            slots: {
              content: [view],
            },
          },
        ],
      },
    }

    expect(findDrupalViewNode(page, {
      viewId: 'testimonials',
      displayId: 'block_1',
      parentUuid: 'paragraph-1',
    })).toBe(view)
    expect(getDrupalViewNodeRows(view)).toEqual([row])
  })

  it('ignores non-matching view nodes', () => {
    const view: CustomElementNode = {
      element: 'drupal-view-default',
      props: {
        viewId: 'work',
        displayId: 'block_1',
      },
    }

    expect(findDrupalViewNode(view, { viewId: 'testimonials' })).toBeNull()
  })

  it('finds view nodes in common CE response envelopes', () => {
    const view: CustomElementNode = {
      element: 'drupal-view-default',
      props: {
        viewId: 'podcast',
        displayId: 'podcast',
      },
    }

    expect(findDrupalViewNodeInResponse({ content: [view] }, {
      viewId: 'podcast',
      displayId: 'podcast',
    })).toBe(view)
    expect(findDrupalViewNodeInResponse({ items: [view] }, { viewId: 'podcast' })).toBe(view)
    expect(findDrupalViewNodeInResponse({ data: [view] }, { viewId: 'podcast' })).toBe(view)
  })

  it('rejects unsafe filter values that look like injected query strings', () => {
    const filter = {
      options: [
        { label: 'News', value: 'news' },
        { label: 'Events', value: 'events' },
      ],
    }

    expect(isSafeDrupalViewControlValue('news')).toBe(true)
    expect(isSafeDrupalViewControlValue('news?sort_by=created')).toBe(false)
    expect(isValidDrupalViewFilterValue(filter, ['news', 'events'])).toBe(true)
    expect(isValidDrupalViewFilterValue(filter, ['news', 'missing'])).toBe(false)
  })

  it('classifies abort errors separately from visible load failures', () => {
    expect(isDrupalViewAbortError(new DOMException('aborted', 'AbortError'))).toBe(true)
    expect(isDrupalViewAbortError(new Error('operation was aborted'))).toBe(true)
    expect(isDrupalViewAbortError(new Error('Network failed'))).toBe(false)
  })

  it('returns a specific message for known Drupal memory failures', () => {
    expect(drupalViewLoadErrorMessage(new Error('Allowed memory size exhausted'))).toContain('Drupal ran out of memory')
    expect(drupalViewLoadErrorMessage(new Error('Network failed'))).toBe('Unable to load results. Please try again.')
  })
})
