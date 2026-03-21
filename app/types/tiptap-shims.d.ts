declare module '@tiptap/core' {
  export interface MinimalNodeFactory {
    create(config: unknown): unknown
  }

  export const Node: MinimalNodeFactory
  export function mergeAttributes(
    ...attributes: Array<Record<string, unknown> | null | undefined>
  ): Record<string, unknown>
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
