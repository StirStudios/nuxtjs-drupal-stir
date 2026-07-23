import type {
  DragHandleRule,
  NestedOptions,
} from '@tiptap/extension-drag-handle'

const structuralContainerTypes = new Set(['div', 'section'])
const nestedListItemTypes = new Set(['listItem', 'taskItem'])

export function scoreDrupalStructuralDragTarget(
  nodeType: string,
  ancestorTypes: string[],
): number {
  if (nestedListItemTypes.has(nodeType)) return 0

  return ancestorTypes.some((type) => structuralContainerTypes.has(type))
    ? 1000
    : 0
}

const preserveDrupalStructuralContainers: DragHandleRule = {
  id: 'preserveDrupalStructuralContainers',
  evaluate: ({ node, $pos, depth }) => {
    const ancestorTypes = Array.from(
      { length: Math.max(0, depth - 1) },
      (_, index) => $pos.node(index + 1).type.name,
    )

    return scoreDrupalStructuralDragTarget(node.type.name, ancestorTypes)
  },
}

export const editorNestedDragHandleOptions: NestedOptions = {
  rules: [preserveDrupalStructuralContainers],
}
