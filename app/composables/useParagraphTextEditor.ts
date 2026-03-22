import { ref, watch, type Ref } from 'vue'
import { Node, mergeAttributes } from '@tiptap/core'
import type { Editor } from '@tiptap/vue-3'
import Heading from '@tiptap/extension-heading'
import BulletList from '@tiptap/extension-bullet-list'
import OrderedList from '@tiptap/extension-ordered-list'
import ListItem from '@tiptap/extension-list-item'

export function useParagraphTextEditor(sourceText: Ref<string>) {
  const HeadingWithClass = Heading.extend({
    addAttributes() {
      return {
        ...this.parent?.(),
        class: {
          default: null,
          parseHTML: element => element.getAttribute('class'),
        },
      }
    },
  })

  const BulletListWithClass = BulletList.extend({
    addAttributes() {
      return {
        class: {
          default: null,
          parseHTML: element => element.getAttribute('class'),
        },
      }
    },
  })

  const OrderedListWithClass = OrderedList.extend({
    addAttributes() {
      return {
        ...this.parent?.(),
        class: {
          default: null,
          parseHTML: element => element.getAttribute('class'),
        },
      }
    },
  })

  const ListItemWithAttributes = ListItem.extend({
    addAttributes() {
      return {
        class: {
          default: null,
          parseHTML: element => element.getAttribute('class'),
        },
        'data-list-item-id': {
          default: null,
          parseHTML: element => element.getAttribute('data-list-item-id'),
        },
      }
    },
  })

  const SectionNode = Node.create({
    name: 'section',
    group: 'block',
    content: 'block*',
    parseHTML() {
      return [{ tag: 'section' }]
    },
    addAttributes() {
      return {
        class: {
          default: null,
        },
      }
    },
    renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, unknown> }) {
      return ['section', mergeAttributes(HTMLAttributes), 0]
    },
  })

  const DrupalMediaNode = Node.create({
    name: 'drupalMedia',
    group: 'block',
    atom: true,
    selectable: true,
    draggable: false,
    parseHTML() {
      return [{ tag: 'drupal-media' }]
    },
    addAttributes() {
      return {
        'data-entity-type': {
          default: null,
        },
        'data-entity-uuid': {
          default: null,
        },
      }
    },
    renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, unknown> }) {
      return ['drupal-media', mergeAttributes(HTMLAttributes), '\u00a0']
    },
  })

  const editorValue = ref('')

  const richTextClass = 'prose max-w-none'
  const editorUi = { base: richTextClass }
  const extensions = [
    HeadingWithClass,
    BulletListWithClass,
    OrderedListWithClass,
    ListItemWithAttributes,
    SectionNode,
    DrupalMediaNode,
  ]

  const headingToolbarItems = [
    { kind: 'heading', level: 2, icon: 'i-lucide-heading-2', tooltip: { text: 'Heading 2' } },
    { kind: 'heading', level: 3, icon: 'i-lucide-heading-3', tooltip: { text: 'Heading 3' } },
    { kind: 'paragraph', icon: 'i-lucide-pilcrow', tooltip: { text: 'Paragraph' } },
  ]

  const markToolbarItems = [
    { kind: 'mark', mark: 'bold', icon: 'i-lucide-bold', tooltip: { text: 'Bold' } },
    { kind: 'mark', mark: 'italic', icon: 'i-lucide-italic', tooltip: { text: 'Italic' } },
    { kind: 'mark', mark: 'underline', icon: 'i-lucide-underline', tooltip: { text: 'Underline' } },
    { kind: 'mark', mark: 'strike', icon: 'i-lucide-strikethrough', tooltip: { text: 'Strike' } },
    { kind: 'linkEdit', icon: 'i-lucide-link', tooltip: { text: 'Link' } },
    { kind: 'unlink', icon: 'i-lucide-link-2-off', tooltip: { text: 'Remove link' } },
  ]

  const listToolbarItems = [
    { kind: 'bulletList', icon: 'i-lucide-list', tooltip: { text: 'Bulleted list' } },
    { kind: 'orderedList', icon: 'i-lucide-list-ordered', tooltip: { text: 'Numbered list' } },
    { kind: 'blockquote', icon: 'i-lucide-text-quote', tooltip: { text: 'Quote' } },
    { kind: 'horizontalRule', icon: 'i-lucide-minus', tooltip: { text: 'Divider' } },
  ]

  const fixedToolbarItems = [
    [
      { kind: 'undo', icon: 'i-lucide-undo', tooltip: { text: 'Undo' } },
      { kind: 'redo', icon: 'i-lucide-redo', tooltip: { text: 'Redo' } },
    ],
    headingToolbarItems,
    markToolbarItems,
    listToolbarItems,
  ]

  const bubbleToolbarItems = [markToolbarItems]

  const suggestionItems = [
    [
      { type: 'label', label: 'Text' },
      { kind: 'paragraph', label: 'Paragraph', icon: 'i-lucide-pilcrow' },
      { kind: 'heading', level: 2, label: 'Heading 2', icon: 'i-lucide-heading-2' },
      { kind: 'heading', level: 3, label: 'Heading 3', icon: 'i-lucide-heading-3' },
    ],
    [
      { type: 'label', label: 'Lists' },
      { kind: 'bulletList', label: 'Bulleted List', icon: 'i-lucide-list' },
      { kind: 'orderedList', label: 'Numbered List', icon: 'i-lucide-list-ordered' },
    ],
    [
      { type: 'label', label: 'Insert' },
      { kind: 'blockquote', label: 'Quote', icon: 'i-lucide-text-quote' },
      { kind: 'horizontalRule', label: 'Divider', icon: 'i-lucide-separator-horizontal' },
    ],
  ]

  function normalizeUrl(value: string): string {
    const href = value.trim()

    if (href === '') return ''

    if (/^(https?:\/\/|mailto:|tel:|#|\/)/i.test(href)) {
      return href
    }

    return `https://${href}`
  }

  const customHandlers = {
    linkEdit: {
      canExecute: (editor: Editor) => editor.isEditable,
      execute: (editor: Editor) => {
        if (import.meta.client === false) return editor.chain()

        const currentHref = String(editor.getAttributes('link')?.href || '')
        const input = window.prompt('Enter URL', currentHref)

        if (input === null) {
          return editor.chain()
        }

        const href = normalizeUrl(input)
        const chain = editor.chain().focus().extendMarkRange('link')

        if (href === '') {
          return chain.unsetLink()
        }

        return chain.setLink({ href })
      },
      isActive: (editor: Editor) => editor.isActive('link'),
      isDisabled: undefined,
    },
    unlink: {
      canExecute: (editor: Editor) => editor.can().chain().focus().extendMarkRange('link').unsetLink().run(),
      execute: (editor: Editor) => editor.chain().focus().extendMarkRange('link').unsetLink(),
      isActive: () => false,
      isDisabled: (editor: Editor) => editor.isActive('link') === false,
    },
  }

  watch(
    sourceText,
    () => {
      syncEditorBuffers(sourceText.value)
    },
    { immediate: true },
  )

  function syncEditorBuffers(value: string): void {
    editorValue.value = value
  }

  return {
    bubbleToolbarItems,
    customHandlers,
    editorUi,
    editorValue,
    extensions,
    fixedToolbarItems,
    richTextClass,
    suggestionItems,
    syncEditorBuffers,
  }
}
