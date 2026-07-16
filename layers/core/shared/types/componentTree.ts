export type ComponentTreeContent =
  | string
  | ComponentTreeNode
  | ComponentTreeContent[]

export interface ComponentTreeNode {
  element: string
  props: Record<string, unknown>
  slots: Record<string, ComponentTreeContent>
}
