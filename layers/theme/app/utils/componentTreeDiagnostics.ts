export type ComponentTreeDiagnosticKind =
  | 'invalid-shape'
  | 'missing-component'
  | 'unknown-field'

export interface ComponentTreeDiagnosticProps {
  element: string
  kind: ComponentTreeDiagnosticKind
}

type ComponentResolver = (element: string) => unknown

function inferPropType(value: unknown): string {
  if (Array.isArray(value)) return 'unknown[]'
  if (value === null || value === undefined) return 'unknown'
  if (typeof value === 'object') return 'Record<string, unknown>'

  return typeof value
}

export function createParagraphComponentStarter(
  props: Record<string, unknown>,
  slotNames: string[],
): string {
  const propLines = Object.entries(props).map(([key, value]) =>
    `  ${JSON.stringify(key)}?: ${inferPropType(value)}`,
  )
  const script = propLines.length
    ? `<script setup lang="ts">\ndefineProps<{\n${propLines.join('\n')}\n}>()\n</${'script'}>\n\n`
    : ''
  const slotLines = slotNames.length
    ? slotNames.map(name =>
        name === 'default'
          ? '  <slot />'
          : `  <slot name="${name}" />`,
      )
    : ['  <!-- Add this paragraph\'s presentation here. -->']

  return `${script}<template>\n  <section>\n${slotLines.join('\n')}\n  </section>\n</template>\n`
}

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
