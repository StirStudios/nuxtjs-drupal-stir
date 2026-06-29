import type { VNode } from 'vue'
import type { VNodeInput } from './useSlotsToolkit'
import {
  findVNodes,
  findVNodesByElement,
  findVNodesByProp,
  getVNodeElement,
  getVNodeProp,
  useVNodes,
} from './useSlotsToolkit'

export function getDrupalPageNodeView(
  node: VNode | undefined,
): Record<string, unknown> | null {
  const view = getVNodeProp<unknown>(node, 'view')
  const firstView = Array.isArray(view) ? view[0] : view

  return firstView && typeof firstView === 'object'
    ? firstView as Record<string, unknown>
    : null
}

export function getDrupalPageNodeViewTargetId(node: VNode | undefined): string {
  const targetId = getDrupalPageNodeView(node)?.targetId

  return typeof targetId === 'string' ? targetId : ''
}

export function isDrupalPageViewNode(
  node: VNode | undefined,
  targetId?: string,
): boolean {
  const viewTargetId = getDrupalPageNodeViewTargetId(node)

  return targetId ? viewTargetId === targetId : !!viewTargetId
}

export function isDrupalPageMediaNode(node: VNode | undefined): boolean {
  return (
    getVNodeProp(node, 'type') === 'image' ||
    getVNodeElement(node) === 'media-image'
  )
}

export const getDrupalPageNodeElement = getVNodeElement
export const getDrupalPageNodeProp = getVNodeProp
export const findDrupalPageNodes = findVNodes
export const findDrupalPageNodesByElement = findVNodesByElement
export const findDrupalPageNodesByProp = findVNodesByProp

export function findDrupalPageViewNodes(
  nodes: VNode[],
  targetId?: string,
): VNode[] {
  return findVNodes(nodes, (node) => isDrupalPageViewNode(node, targetId))
}

export function useDrupalPageNodes(input: VNodeInput) {
  const nodes = useVNodes(input)

  return {
    ...nodes,
    text: () =>
      nodes.filter((node) => typeof getVNodeProp(node, 'text') === 'string'),
    body: () => nodes.filter((node) => getVNodeProp(node, 'body') !== undefined),
    media: () => nodes.filter(isDrupalPageMediaNode),
    views: (targetId?: string) =>
      nodes.filter((node) => isDrupalPageViewNode(node, targetId)),
    viewOf: getDrupalPageNodeView,
    viewTargetIdOf: getDrupalPageNodeViewTargetId,
    isMedia: isDrupalPageMediaNode,
    isView: isDrupalPageViewNode,
  }
}
