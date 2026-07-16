import type { ComputedRef, InjectionKey } from 'vue'

export type LayoutEditLinkIndex = ReadonlyMap<string, string>

export const layoutEditLinksKey: InjectionKey<ComputedRef<LayoutEditLinkIndex>> =
  Symbol('stir-layout-edit-links')

export function buildLayoutEditLinkIndex(value: unknown): LayoutEditLinkIndex {
  const links = new Map<string, string>()
  const visited = new WeakSet<object>()

  const visit = (candidate: unknown): void => {
    if (!candidate || typeof candidate !== 'object') return
    if (visited.has(candidate)) return

    visited.add(candidate)

    if (Array.isArray(candidate)) {
      candidate.forEach(visit)
      return
    }

    const node = candidate as Record<string, unknown>
    const props = node.props && typeof node.props === 'object'
      ? node.props as Record<string, unknown>
      : null
    const uuid = typeof props?.uuid === 'string' ? props.uuid.trim() : ''
    const editLink = typeof props?.editLink === 'string'
      ? props.editLink.trim()
      : ''

    if (node.element === 'paragraph-layout' && uuid && editLink) {
      links.set(uuid, editLink)
    }

    Object.values(node).forEach(visit)
  }

  visit(value)

  return links
}
