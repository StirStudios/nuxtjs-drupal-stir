import type { VNode } from 'vue'
import { cloneVNode, computed } from 'vue'
import type { CustomElementNode } from '~/types'

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

function drupalViewRowSignature(rows: VNode[]): string {
  return rows.map((node, index) => String(node.key ?? index)).join('|')
}

export function useDrupalViewRenderedRows(options: {
  dynamicRows: Ref<unknown[] | null>
  randomizeEnabled: Ref<boolean>
  randomizeRowsOnClient: Ref<boolean>
  resolveSlotRows: () => VNode[]
  shuffleRows: (rows: VNode[]) => VNode[]
}) {
  let randomizedRowsCache: { signature: string, rows: VNode[] } | null = null

  const hasDynamicRows = computed(() => options.dynamicRows.value !== null)
  const dynamicRenderedRows = computed(() => normalizeDynamicDrupalViewRows(options.dynamicRows.value))

  function getOrderedStaticRows(rowOptions: { teaser?: boolean } = {}) {
    const rows = options.resolveSlotRows()

    if (!rowOptions.teaser) return rows

    return withDrupalViewTeaserProps(rows)
  }

  function getStaticRows(rowOptions: { teaser?: boolean } = { teaser: true }) {
    const rows = getOrderedStaticRows(rowOptions)

    if (!options.randomizeEnabled.value || !options.randomizeRowsOnClient.value) {
      randomizedRowsCache = null
      return rows
    }

    const signature = drupalViewRowSignature(rows)

    if (randomizedRowsCache?.signature !== signature) {
      randomizedRowsCache = {
        signature,
        rows: options.shuffleRows(rows),
      }
    }

    return randomizedRowsCache.rows
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
