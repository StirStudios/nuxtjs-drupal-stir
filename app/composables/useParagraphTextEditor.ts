import { ref, watch, type Ref } from 'vue'
import { Node, mergeAttributes } from '@tiptap/core'
import type { Editor } from '@tiptap/vue-3'

export function useParagraphTextEditor(sourceText: Ref<string>, isEditing: Ref<boolean>) {
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

  const isSourceMode = ref(false)
  const editorValue = ref('')
  const sourceEditorValue = ref('')

  const richTextClass = 'prose max-w-none'
  const editorUi = { base: richTextClass }
  const extensions = [SectionNode, DrupalMediaNode]

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
    { kind: 'linkEdit', icon: 'i-lucide-link', tooltip: { text: 'Edit link' } },
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
      if (!isEditing.value) {
        syncEditorBuffers(sourceText.value)
      }
    },
    { immediate: true },
  )

  function formatHtmlForSource(html: string): string {
    const source = (html ?? '').trim()

    if (!source) return ''

    const rawTokens = source
      .replace(/>\s+</g, '><')
      .replace(/</g, '\n<')
      .trim()
      .split('\n')
      .filter(Boolean)

    const tokens = rawTokens
      .map((token) => {
        if (token.startsWith('<')) {
          return token.trim()
        }

        const hasLeadingWhitespace = /^\s/.test(token)
        const hasTrailingWhitespace = /\s$/.test(token)
        const collapsed = token.replace(/\s+/g, ' ').trim()

        if (!collapsed) {
          return ''
        }

        const prefix = hasLeadingWhitespace ? ' ' : ''
        const suffix = hasTrailingWhitespace ? ' ' : ''

        return `${prefix}${collapsed}${suffix}`
      })
      .filter(Boolean)

    let indent = 0
    const lines: string[] = []

    for (const token of tokens) {
      const isClosing = /^<\//.test(token)
      const isSelfClosing = /\/>$/.test(token) || /^<(br|hr|img|input|meta|link)\b/i.test(token)
      const isOpening = /^<[^!/][^>]*>$/.test(token) && !isClosing && !isSelfClosing

      if (isClosing) {
        indent = Math.max(indent - 1, 0)
      }

      lines.push(`${'  '.repeat(indent)}${token}`)

      if (isOpening) {
        indent += 1
      }
    }

    return lines.join('\n')
  }

  function syncEditorBuffers(value: string): void {
    editorValue.value = value
    sourceEditorValue.value = value
  }

  function setSourceMode(enabled: boolean): void {
    if (!isEditing.value || isSourceMode.value === enabled) return

    if (enabled) {
      sourceEditorValue.value = formatHtmlForSource(editorValue.value)
    } else {
      editorValue.value = sourceEditorValue.value
    }

    isSourceMode.value = enabled
  }

  const toggleSourceMode = () => {
    setSourceMode(!isSourceMode.value)
  }

  return {
    bubbleToolbarItems,
    customHandlers,
    editorUi,
    editorValue,
    extensions,
    fixedToolbarItems,
    isSourceMode,
    richTextClass,
    setSourceMode,
    sourceEditorValue,
    suggestionItems,
    syncEditorBuffers,
    toggleSourceMode,
  }
}
