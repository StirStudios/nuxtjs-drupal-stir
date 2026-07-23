import { Node, mergeAttributes } from '@tiptap/core'

type StirCtaAttributes = Record<string, string>

function readAttributes(element: Element): StirCtaAttributes {
  return Object.fromEntries(
    Array.from(element.attributes, ({ name, value }) => [name, value]),
  )
}

export const StirCta = Node.create({
  name: 'stirCta',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  parseHTML() {
    return [{ tag: 'stir-cta' }]
  },

  addAttributes() {
    return {
      preservedAttributes: {
        default: {},
        parseHTML: readAttributes,
        rendered: false,
      },
    }
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'stir-cta',
      mergeAttributes(node.attrs.preservedAttributes, HTMLAttributes),
      '\u00a0',
    ]
  },

  addNodeView() {
    return ({ node }) => {
      const attributes = node.attrs.preservedAttributes as StirCtaAttributes
      const dom = document.createElement('div')
      const label = document.createElement('span')
      const description = document.createElement('span')
      const variant = attributes['data-variant']?.trim()

      dom.className = 'admin-editor-media-placeholder'
      dom.contentEditable = 'false'
      dom.dataset.stirCtaPlaceholder = 'true'
      dom.setAttribute('role', 'note')

      label.className = 'admin-editor-media-placeholder-label'
      label.textContent = variant ? `Call to action: ${variant}` : 'Call to action'

      description.className = 'admin-editor-media-placeholder-description'
      description.textContent = 'Preserved from Drupal and restored after saving.'

      dom.append(label, description)

      return { dom }
    }
  },
})
