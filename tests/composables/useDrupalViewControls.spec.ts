import { describe, expect, it } from 'vitest'
import type { CustomElementNode } from '../../layers/theme/app/types'
import {
  buildDrupalViewSearchParams,
  findDrupalViewNode,
  getDrupalViewNodeRows,
  mapDrupalViewFilterOptions,
  normalizeDrupalViewSortOrderValue,
} from '../../layers/theme/app/composables/useDrupalViewControls'

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
})
