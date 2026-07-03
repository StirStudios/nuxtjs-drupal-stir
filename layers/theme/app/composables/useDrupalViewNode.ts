import type { CustomElementNode } from '~/types'

interface DrupalViewNodeCriteria {
  displayId?: string
  parentUuid?: string
  viewId?: string
}

export function getDrupalViewNodeProps(node: CustomElementNode): Record<string, unknown> {
  if (node.props && typeof node.props === 'object') {
    return node.props
  }

  const flat = { ...node }

  delete flat.element
  delete flat.props
  delete flat.slots

  return flat as Record<string, unknown>
}

export function getDrupalViewNodeSlots(node: CustomElementNode): Record<string, unknown> {
  if (node.slots && typeof node.slots === 'object') {
    return node.slots
  }

  return {}
}

export function getDrupalViewNodeRows(node: CustomElementNode): unknown[] {
  const slots = getDrupalViewNodeSlots(node)
  const slotRows = slots.rows

  if (Array.isArray(slotRows)) return slotRows

  const legacyRows = (node as Record<string, unknown>).rows

  if (Array.isArray(legacyRows)) return legacyRows

  return []
}

export function isMatchingDrupalViewNode(
  node: CustomElementNode,
  criteria: DrupalViewNodeCriteria = {},
): boolean {
  const nodeProps = getDrupalViewNodeProps(node)
  const nodeViewId = String(nodeProps.viewId || '')
  const nodeDisplayId = String(nodeProps.displayId || '')
  const nodeParentUuid = String(nodeProps.parentUuid || '')
  const hasViewProps = nodeViewId.length > 0 || nodeDisplayId.length > 0
  const hasViewElement = Boolean(node.element?.startsWith('drupal-view-'))

  if (!hasViewProps && !hasViewElement) return false

  if (criteria.viewId && nodeViewId !== criteria.viewId) return false
  if (criteria.displayId && nodeDisplayId !== criteria.displayId) return false
  if (criteria.parentUuid && nodeParentUuid !== criteria.parentUuid) return false

  return true
}

export function findDrupalViewNode(
  input: unknown,
  criteria: DrupalViewNodeCriteria = {},
): CustomElementNode | null {
  if (!input) return null

  if (Array.isArray(input)) {
    for (const item of input) {
      const found = findDrupalViewNode(item, criteria)

      if (found) return found
    }

    return null
  }

  if (typeof input !== 'object') return null
  const node = input as CustomElementNode

  if (isMatchingDrupalViewNode(node, criteria)) return node

  const childCandidates: unknown[] = []
  const slots = getDrupalViewNodeSlots(node)

  if (Object.keys(slots).length > 0) {
    childCandidates.push(...Object.values(slots))
  }

  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (key === 'element' || key === 'props' || key === 'slots') continue
    childCandidates.push(value)
  }

  for (const child of childCandidates) {
    const found = findDrupalViewNode(child, criteria)

    if (found) return found
  }

  return null
}

export function findDrupalViewNodeInResponse(
  response: unknown,
  criteria: DrupalViewNodeCriteria = {},
): CustomElementNode | null {
  const responseRecord =
    response && typeof response === 'object'
      ? (response as Record<string, unknown>)
      : null
  const candidates = [
    response,
    responseRecord?.content,
    responseRecord?.items,
    responseRecord?.data,
  ]

  for (const candidate of candidates) {
    const viewNode = findDrupalViewNode(candidate, criteria)

    if (viewNode) return viewNode
  }

  return null
}

