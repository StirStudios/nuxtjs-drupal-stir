import type { VNode } from 'vue'
import type { DrupalMediaNodeProps } from '../types/CustomElements'
import type { VNodeInput } from './useSlotsToolkit'
import {
  findVNodes,
  findVNodesByElement,
  findVNodesByProp,
  getVNodeElement,
  getVNodeProp,
  getVNodeProps,
  useVNodes,
} from './useSlotsToolkit'
import { normalizeDrupalMediaType } from '../utils/drupalMediaTypes'
import { resolveDrupalLink, type DrupalLink } from '../utils/drupalLink'
import { toEditableRichTextProps } from '../utils/editableRichText'

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

  if (typeof targetId === 'string' && targetId) return targetId

  const viewId = getVNodeProp<unknown>(node, 'viewId')

  return typeof viewId === 'string' ? viewId : ''
}

export function isDrupalPageViewNode(
  node: VNode | undefined,
  targetId?: string,
): boolean {
  const viewTargetId = getDrupalPageNodeViewTargetId(node)

  return targetId ? viewTargetId === targetId : !!viewTargetId
}

export function isDrupalPageMediaNode(node: VNode | undefined): boolean {
  const type = getVNodeProp<unknown>(node, 'type')

  return (
    normalizeDrupalMediaType(type) === type ||
    getVNodeElement(node) === 'media-image'
  )
}

export function isDrupalPageLinkNode(node: VNode | undefined): boolean {
  const link = getVNodeProp<unknown>(node, 'link')

  return Boolean(link) && typeof link === 'object'
}

export function getDrupalPageNodeLink(node: VNode | undefined) {
  return resolveDrupalLink(
    isDrupalPageLinkNode(node) ? getVNodeProp<DrupalLink>(node, 'link') : undefined,
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
    imageProps: () =>
      nodes
        .filter(isDrupalPageMediaNode)
        .map((node) => getVNodeProps<DrupalMediaNodeProps>(node))
        .filter((image) => image.type === 'image' && typeof image.src === 'string'),
    links: () => nodes.filter(isDrupalPageLinkNode),
    views: (targetId?: string) =>
      nodes.filter((node) => isDrupalPageViewNode(node, targetId)),
    linkOf: getDrupalPageNodeLink,
    textPropsOf: (node: VNode | undefined, classes?: string) =>
      toEditableRichTextProps(getVNodeProps(node), classes),
    viewOf: getDrupalPageNodeView,
    viewTargetIdOf: getDrupalPageNodeViewTargetId,
    isLink: isDrupalPageLinkNode,
    isMedia: isDrupalPageMediaNode,
    isView: isDrupalPageViewNode,
  }
}
