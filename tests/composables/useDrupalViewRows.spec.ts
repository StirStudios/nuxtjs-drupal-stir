import { h, ref } from 'vue'
import { describe, expect, it } from 'vitest'
import {
  normalizeDynamicDrupalViewRows,
  useDrupalViewRenderedRows,
  withDrupalViewTeaserProps,
} from '../../layers/theme/app/composables/useDrupalViewRows'

describe('Drupal view row helpers', () => {
  it('normalizes dynamic custom element rows as teasers', () => {
    const rows = normalizeDynamicDrupalViewRows([
      {
        element: 'node-project',
        props: {
          uuid: 'row-1',
          title: 'Project',
          isHero: true,
          type: 'full',
        },
      },
    ])

    expect(rows).toHaveLength(1)
    expect(rows[0]?.key).toBe('row-1')
    expect(rows[0]?.node).toMatchObject({
      element: 'node-project',
      props: {
        title: 'Project',
        isHero: false,
        type: 'teaser',
      },
    })
  })

  it('normalizes non-custom-element dynamic rows by index', () => {
    expect(normalizeDynamicDrupalViewRows(['raw'])).toEqual([
      {
        key: '0',
        node: 'raw',
      },
    ])
  })

  it('clones static rows with teaser props', () => {
    const [row] = withDrupalViewTeaserProps([
      h('article', { type: 'full', isHero: true }),
    ])

    expect(row?.props).toMatchObject({
      isHero: false,
      type: 'teaser',
    })
  })

  it('renders dynamic rows before static slot rows', () => {
    const rows = useDrupalViewRenderedRows({
      dynamicRows: ref([
        {
          element: 'node-project',
          props: {
            id: 1,
          },
        },
      ]),
      randomizeEnabled: ref(false),
      randomizeRowsOnClient: ref(false),
      resolveSlotRows: () => [h('article', { key: 'static' })],
      shuffleRows: rows => rows,
    })

    expect(rows.hasRows()).toBe(true)
    expect(rows.getRenderedRows()).toMatchObject([
      {
        key: '1',
        type: 'dynamic',
      },
    ])
  })

  it('can randomize static rows after client mount', () => {
    const rows = useDrupalViewRenderedRows({
      dynamicRows: ref(null),
      randomizeEnabled: ref(true),
      randomizeRowsOnClient: ref(true),
      resolveSlotRows: () => [
        h('article', { key: 'first' }),
        h('article', { key: 'second' }),
      ],
      shuffleRows: rows => [...rows].reverse(),
    })

    expect(rows.getRenderedRows().map(row => row.key)).toEqual(['second', 'first'])
  })
})
