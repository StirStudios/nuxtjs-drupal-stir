import type { VNode } from 'vue'
import { cloneVNode } from 'vue'
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
