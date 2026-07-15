export type ComponentTreeDiagnosticKind =
  | 'invalid-shape'
  | 'missing-component'
  | 'unknown-field'

export interface ComponentTreeDiagnosticProps {
  element: string
  kind: ComponentTreeDiagnosticKind
}

type ComponentResolver = (element: string) => unknown

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function diagnostic(
  element: string,
  kind: ComponentTreeDiagnosticKind,
): Record<string, unknown> {
  return {
    element: 'stir-missing-component',
    props: { element, kind },
    slots: {},
  }
}

export function prepareComponentTreeForDevelopment(
  value: unknown,
  resolveComponent: ComponentResolver,
): unknown {
  if (value === null || value === undefined || typeof value === 'string') {
    return value
  }

  if (Array.isArray(value)) {
    return value.map(item => prepareComponentTreeForDevelopment(item, resolveComponent))
  }

  if (!isRecord(value) || typeof value.element !== 'string' || !value.element) {
    return diagnostic('', 'invalid-shape')
  }

  if (!resolveComponent(value.element)) {
    return diagnostic(
      value.element,
      value.element.startsWith('field-')
        ? 'unknown-field'
        : 'missing-component',
    )
  }

  if (!isRecord(value.slots)) return value

  return {
    ...value,
    slots: Object.fromEntries(
      Object.entries(value.slots).map(([name, content]) => [
        name,
        prepareComponentTreeForDevelopment(content, resolveComponent),
      ]),
    ),
  }
}
