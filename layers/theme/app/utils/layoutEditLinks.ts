import type { ComputedRef, InjectionKey } from 'vue'

export type LayoutEditLinkIndex = ReadonlyMap<string, string>

export const layoutEditLinksKey: InjectionKey<ComputedRef<LayoutEditLinkIndex>> =
  Symbol('stir-layout-edit-links')

/** Adds the current frontend page as Drupal's trusted post-edit destination. */
export function withEditorDestination(
  editLink: string,
  frontendUrl: string,
): string {
  try {
    const backend = new URL(editLink)
    const frontend = new URL(frontendUrl)
    const allowedSchemes = new Set(['http:', 'https:'])

    if (
      !allowedSchemes.has(backend.protocol)
      || !allowedSchemes.has(frontend.protocol)
    ) {
      return editLink
    }

    // Core reserves `destination` for internal redirects and may reject an
    // absolute URL while rebuilding or submitting an entity form. The
    // trusted_redirect module owns `trusted_destination` and validates its
    // hostname before allowing the external return.
    backend.searchParams.delete('destination')
    backend.searchParams.set('trusted_destination', frontend.toString())
    return backend.toString()
  }
  catch {
    return editLink
  }
}

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
