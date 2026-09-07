import type { VNode } from 'vue'
import { cloneVNode, computed } from 'vue'
import type { CustomElementNode } from '#stir/types'

export type RenderedDrupalViewRow =
  | {
      key: string
      type: 'dynamic'
      node: unknown
    }
  | {
      key: string
      type: 'static'
      node: VNode
    }

export interface NormalizedDynamicDrupalViewRow {
  key: string
  node: unknown
}

export function normalizeDynamicDrupalViewRows(rows: unknown[] | null): NormalizedDynamicDrupalViewRow[] {
  if (!rows) return []

  return rows.map((row, index) => {
    if (
      row &&
      typeof row === 'object' &&
      'props' in (row as Record<string, unknown>) &&
      typeof (row as CustomElementNode).props === 'object'
    ) {
      const node = row as CustomElementNode
      const patched: CustomElementNode = {
        ...node,
        props: {
          ...node.props,
          isHero: false,
          type: 'teaser',
        },
      }

      return {
        key: String(node.props?.uuid || node.props?.id || index),
        node: patched,
      }
    }

    return {
      key: String(index),
      node: row,
    }
  })
}

export function withDrupalViewTeaserProps(rows: VNode[]): VNode[] {
  return rows.map((node) => cloneVNode(node, { isHero: false, type: 'teaser' }, true))
}

export function useDrupalViewRenderedRows(options: {
  dynamicRows: Ref<unknown[] | null>
  resolveSlotRows: () => VNode[]
}) {
  const hasDynamicRows = computed(() => options.dynamicRows.value !== null)
  const dynamicRenderedRows = computed(() => normalizeDynamicDrupalViewRows(options.dynamicRows.value))

  function getStaticRows(rowOptions: { teaser?: boolean } = { teaser: true }) {
    const rows = options.resolveSlotRows()

    if (!rowOptions.teaser) return rows

    return withDrupalViewTeaserProps(rows)
  }

  function hasRows(): boolean {
    return hasDynamicRows.value
      ? dynamicRenderedRows.value.length > 0
      : getStaticRows().length > 0
  }

  function getRenderedRows(rowOptions: { teaser?: boolean } = { teaser: true }): RenderedDrupalViewRow[] {
    if (hasDynamicRows.value) {
      return dynamicRenderedRows.value.map((row) => ({
        key: row.key,
        type: 'dynamic',
        node: row.node,
      }))
    }

    return getStaticRows(rowOptions).map((node, index) => ({
      key: String(node.key ?? index),
      type: 'static',
      node,
    }))
  }

  return {
    dynamicRenderedRows,
    getRenderedRows,
    getStaticRows,
    hasDynamicRows,
    hasRows,
  }
}
