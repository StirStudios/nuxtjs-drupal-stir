declare module '@tiptap/core' {
  export interface MinimalNodeFactory {
    create(config: unknown): unknown
  }

  export const Node: MinimalNodeFactory
  export function mergeAttributes(
    ...attributes: Array<Record<string, unknown> | null | undefined>
  ): Record<string, unknown>
}

declare module '@tiptap/extension-heading' {
  const Heading: {
    extend(config: unknown): unknown
  }
  export default Heading
}

declare module '@tiptap/extension-bullet-list' {
  const BulletList: {
    extend(config: unknown): unknown
  }
  export default BulletList
}

declare module '@tiptap/extension-ordered-list' {
  const OrderedList: {
    extend(config: unknown): unknown
  }
  export default OrderedList
}

declare module '@tiptap/extension-list-item' {
  const ListItem: {
    extend(config: unknown): unknown
  }
  export default ListItem
}

declare module '@tiptap/vue-3' {
  export interface EditorChain {
    focus(): EditorChain
    extendMarkRange(markName: string): EditorChain
    unsetLink(): EditorChain
    setLink(attributes: { href: string }): EditorChain
    run(): boolean
  }

  export interface Editor {
    isEditable: boolean
    isActive(name: string): boolean
    getAttributes(name: string): Record<string, unknown>
    chain(): EditorChain
    can(): { chain(): EditorChain }
  }
}
