import { isHTMLTag, isMathMLTag, isSVGTag } from '@vue/shared'

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

function isNativeElement(element: string): boolean {
  return isHTMLTag(element) || isSVGTag(element) || isMathMLTag(element)
}

function prepareSlots(
  slots: unknown,
  resolveComponent: ComponentResolver,
  diagnoseMissingComponents: boolean,
): Record<string, unknown> | undefined {
  if (!isRecord(slots)) return undefined

  return Object.fromEntries(
    Object.entries(slots).map(([name, content]) => [
      name,
      prepareComponentTreeForDevelopment(
        content,
        resolveComponent,
        diagnoseMissingComponents,
      ),
    ]),
  )
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
  diagnoseMissingComponents = true,
): unknown {
  if (value === null || value === undefined || typeof value === 'string') {
    return value
  }

  if (Array.isArray(value)) {
    return value.map(item => prepareComponentTreeForDevelopment(
      item,
      resolveComponent,
      diagnoseMissingComponents,
    ))
  }

  if (!isRecord(value) || typeof value.element !== 'string' || !value.element) {
    return diagnostic('', 'invalid-shape')
  }

  if (isNativeElement(value.element)) {
    return {
      element: 'stir-native-element',
      props: {
        ...(isRecord(value.props) ? value.props : {}),
        tag: value.element,
      },
      slots: prepareSlots(
        value.slots,
        resolveComponent,
        diagnoseMissingComponents,
      ) ?? {},
    }
  }

  if (diagnoseMissingComponents && !resolveComponent(value.element)) {
    return diagnostic(
      value.element,
      value.element.startsWith('field-')
        ? 'unknown-field'
        : 'missing-component',
    )
  }

  const slots = prepareSlots(
    value.slots,
    resolveComponent,
    diagnoseMissingComponents,
  )

  if (!slots) return value

  return {
    ...value,
    slots,
  }
}
