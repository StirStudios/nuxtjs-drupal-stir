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
      resolveSlotRows: () => [h('article', { key: 'static' })],
    })

    expect(rows.hasRows()).toBe(true)
    expect(rows.getRenderedRows()).toMatchObject([
      {
        key: '1',
        type: 'dynamic',
      },
    ])
  })

  it('preserves Drupal static row order across repeated reads', () => {
    const rows = useDrupalViewRenderedRows({
      dynamicRows: ref(null),
      resolveSlotRows: () => [
        h('article', { key: 'first' }),
        h('article', { key: 'second' }),
      ],
    })

    expect(rows.getRenderedRows().map(row => row.key)).toEqual(['first', 'second'])
    expect(rows.getRenderedRows().map(row => row.key)).toEqual(['first', 'second'])
  })

  it('preserves each fetched page order and returns to the authored rows on reset', () => {
    const dynamicRows = ref<unknown[] | null>(null)
    const staticRows = [h('article', { key: 'third' }), h('article', { key: 'first' })]
    const rows = useDrupalViewRenderedRows({
      dynamicRows,
      resolveSlotRows: () => staticRows,
    })

    expect(rows.getStaticRows({ teaser: false })).toBe(staticRows)
    expect(rows.getRenderedRows().map(row => row.key)).toEqual(['third', 'first'])
    dynamicRows.value = [
      { element: 'node-project', props: { id: 7 } },
      { element: 'node-project', props: { id: 2 } },
    ]
    expect(rows.getRenderedRows().map(row => row.key)).toEqual(['7', '2'])
    dynamicRows.value = []
    expect(rows.hasRows()).toBe(false)
    dynamicRows.value = null
    expect(rows.getRenderedRows().map(row => row.key)).toEqual(['third', 'first'])
  })
})
